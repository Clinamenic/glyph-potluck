import * as opentype from 'opentype.js';
import { CoordinateTransformer } from './CoordinateTransformer';

export interface SVGPathCommand {
  type: 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';
  coordinates: number[];
  relative: boolean;
}

export interface GlyphMetrics {
  leftSideBearing: number;
  rightSideBearing: number;
  advanceWidth: number;
  bounds: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
}

export class GlyphConverter {
  /**
   * Converts an SVG path string to an OpenType glyph
   */
  static svgPathToOpenTypeGlyph(svgPath: string, unicode: number): opentype.Glyph {
    try {
      // Transform SVG coordinates to OpenType coordinates
      const unitsPerEm = 1000; // Standard OpenType units per em
      const transformedPath = CoordinateTransformer.svgToOpenType(svgPath, unitsPerEm);
      
      console.log(`🔍 Coordinate transformation for U+${unicode.toString(16).toUpperCase()}:`);
      console.log('  Original SVG:', svgPath);
      console.log('  Transformed:', transformedPath);
      
      // Validate the transformation
      const validation = CoordinateTransformer.validateTransformation(svgPath, transformedPath, unitsPerEm);
      if (!validation.isValid) {
        console.warn(`⚠️ Coordinate transformation warnings for U+${unicode.toString(16).toUpperCase()}:`, validation.warnings);
      }
      
      // Parse transformed path into commands
      const commands = this.parseSVGPath(transformedPath);
      
      // Convert to OpenType path
      const path = this.buildOpenTypePath(commands);
      
      // Calculate glyph metrics from transformed path
      const metrics = this.calculateGlyphMetrics(transformedPath);
      
      // Create OpenType glyph
      return new opentype.Glyph({
        name: `uni${unicode.toString(16).toUpperCase()}`,
        unicode: unicode,
        path: path,
        advanceWidth: metrics.advanceWidth
      });
    } catch (error) {
      console.error(`❌ Failed to convert SVG to glyph for U+${unicode.toString(16).toUpperCase()}:`, error);
      throw new Error(`Glyph conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parses SVG path string into command objects
   */
  private static parseSVGPath(svgPath: string): SVGPathCommand[] {
    const commands: SVGPathCommand[] = [];
    const pathRegex = /([MLHVCSQTAZ])\s*([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = pathRegex.exec(svgPath)) !== null) {
      const type = match[1].toUpperCase() as SVGPathCommand['type'];
      const coordsString = match[2].trim();
      
      if (type === 'Z') {
        // Close path command has no coordinates
        commands.push({ type: 'Z', coordinates: [], relative: false });
        continue;
      }

      // Parse coordinates
      const coords = coordsString.split(/[\s,]+/).filter(s => s.length > 0).map(Number);
      
      if (coords.length === 0) {
        console.warn(`⚠️ No coordinates found for command ${type}`);
        continue;
      }

      // Determine if command is relative (lowercase) or absolute (uppercase)
      const relative = match[1] === match[1].toLowerCase();
      
      commands.push({
        type,
        coordinates: coords,
        relative
      });
    }

    return commands;
  }

  /**
   * Converts SVG path commands to OpenType path
   */
  private static buildOpenTypePath(commands: SVGPathCommand[]): opentype.Path {
    const path = new opentype.Path();
    let currentX = 0;
    let currentY = 0;

    commands.forEach((command) => {
      switch (command.type) {
        case 'M': // Move to
          if (command.coordinates.length >= 2) {
            const x = command.relative ? currentX + command.coordinates[0] : command.coordinates[0];
            const y = command.relative ? currentY + command.coordinates[1] : command.coordinates[1];
            path.moveTo(x, y);
            currentX = x;
            currentY = y;
          }
          break;

        case 'L': // Line to
          if (command.coordinates.length >= 2) {
            const x = command.relative ? currentX + command.coordinates[0] : command.coordinates[0];
            const y = command.relative ? currentY + command.coordinates[1] : command.coordinates[1];
            path.lineTo(x, y);
            currentX = x;
            currentY = y;
          }
          break;

        case 'H': // Horizontal line to
          if (command.coordinates.length >= 1) {
            const x = command.relative ? currentX + command.coordinates[0] : command.coordinates[0];
            path.lineTo(x, currentY);
            currentX = x;
          }
          break;

        case 'V': // Vertical line to
          if (command.coordinates.length >= 1) {
            const y = command.relative ? currentY + command.coordinates[0] : command.coordinates[0];
            path.lineTo(currentX, y);
            currentY = y;
          }
          break;

        case 'C': // Cubic curve to
          if (command.coordinates.length >= 6) {
            const x1 = command.relative ? currentX + command.coordinates[0] : command.coordinates[0];
            const y1 = command.relative ? currentY + command.coordinates[1] : command.coordinates[1];
            const x2 = command.relative ? currentX + command.coordinates[2] : command.coordinates[2];
            const y2 = command.relative ? currentY + command.coordinates[3] : command.coordinates[3];
            const x = command.relative ? currentX + command.coordinates[4] : command.coordinates[4];
            const y = command.relative ? currentY + command.coordinates[5] : command.coordinates[5];
            
            path.bezierCurveTo(x1, y1, x2, y2, x, y);
            currentX = x;
            currentY = y;
          }
          break;

        case 'S': // Smooth cubic curve to
          if (command.coordinates.length >= 4) {
            // For smooth curves, we need to calculate the control point
            // This is a simplified implementation
            const x2 = command.relative ? currentX + command.coordinates[0] : command.coordinates[0];
            const y2 = command.relative ? currentY + command.coordinates[1] : command.coordinates[1];
            const x = command.relative ? currentX + command.coordinates[2] : command.coordinates[2];
            const y = command.relative ? currentY + command.coordinates[3] : command.coordinates[3];
            
            // Use current position as first control point for smooth curves
            path.bezierCurveTo(currentX, currentY, x2, y2, x, y);
            currentX = x;
            currentY = y;
          }
          break;

        case 'Z': // Close path
          path.closePath();
          break;

        default:
          console.warn(`⚠️ Unsupported SVG command: ${command.type}`);
          break;
      }
    });

    return path;
  }

  /**
   * Calculates glyph metrics from SVG path
   */
  private static calculateGlyphMetrics(svgPath: string): GlyphMetrics {
    // Parse path to get bounding box
    const commands = this.parseSVGPath(svgPath);
    
    let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
    let currentX = 0, currentY = 0;

    commands.forEach(command => {
      switch (command.type) {
        case 'M':
        case 'L':
          if (command.coordinates.length >= 2) {
            const x = command.relative ? currentX + command.coordinates[0] : command.coordinates[0];
            const y = command.relative ? currentY + command.coordinates[1] : command.coordinates[1];
            xMin = Math.min(xMin, x);
            yMin = Math.min(yMin, y);
            xMax = Math.max(xMax, x);
            yMax = Math.max(yMax, y);
            currentX = x;
            currentY = y;
          }
          break;
        // Add other cases as needed
      }
    });

    // Calculate metrics
    const width = xMax - xMin;
    // const height = yMax - yMin; // Not used currently
    
    // Default side bearings (can be optimized later)
    const leftSideBearing = Math.max(0, -xMin);
    const rightSideBearing = Math.max(0, 50); // Default right margin
    
    // Calculate advance width based on character bounds
    const advanceWidth = Math.round(width + leftSideBearing + rightSideBearing);

    return {
      leftSideBearing: Math.round(leftSideBearing),
      rightSideBearing: Math.round(rightSideBearing),
      advanceWidth,
      bounds: {
        xMin: Math.round(xMin),
        yMin: Math.round(yMin),
        xMax: Math.round(xMax),
        yMax: Math.round(yMax)
      }
    };
  }

  /**
   * Validates if an SVG path can be converted to a glyph
   */
  static validateSVGPath(svgPath: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!svgPath || svgPath.trim().length === 0) {
      errors.push('SVG path is empty');
      return { isValid: false, errors };
    }

    try {
      const commands = this.parseSVGPath(svgPath);
      
      if (commands.length === 0) {
        errors.push('No valid SVG commands found');
      }

      // Check for at least one move command
      const hasMoveCommand = commands.some(cmd => cmd.type === 'M');
      if (!hasMoveCommand) {
        errors.push('SVG path must start with a move command (M)');
      }

      // Check for valid coordinate counts
      commands.forEach((cmd, index) => {
        if (cmd.type !== 'Z' && cmd.coordinates.length === 0) {
          errors.push(`Command ${index + 1} (${cmd.type}) has no coordinates`);
        }
      });

    } catch (error) {
      errors.push(`Failed to parse SVG path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
