import { SVGPathCommand } from './GlyphConverter';

export interface TransformedPathCommand {
  type: SVGPathCommand['type'];
  coordinates: number[];
  relative: boolean;
}

export class CoordinateTransformer {
  /**
   * Transforms SVG coordinates (Y-down) to OpenType coordinates (Y-up)
   * SVG: Y increases downward from top-left origin
   * OpenType: Y increases upward from bottom-left origin
   * Also positions glyph relative to baseline for proper OpenType positioning
   */
  static svgToOpenType(svgPath: string, unitsPerEm: number): string {
    try {
      // Parse SVG path into commands
      const commands = this.parseSVGPath(svgPath);
      
      // Calculate baseline positioning
      const baselineOffset = this.calculateBaselineOffset(commands, unitsPerEm);
      
      // Transform coordinates with baseline positioning
      const transformedCommands = commands.map(cmd => 
        this.transformCommand(cmd, unitsPerEm, false, baselineOffset)
      );
      
      // Convert back to path string
      return this.commandsToPathString(transformedCommands);
      
    } catch (error) {
      console.error('❌ Coordinate transformation failed:', error);
      throw new Error(`Coordinate transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transforms OpenType coordinates (Y-up) back to SVG coordinates (Y-down)
   * Useful for debugging and validation
   */
  static openTypeToSvg(opentypePath: string, unitsPerEm: number): string {
    try {
      // Parse OpenType path into commands
      const commands = this.parseSVGPath(opentypePath);
      
      // Transform coordinates (reverse the Y transformation)
      const transformedCommands = commands.map(cmd => 
        this.transformCommand(cmd, unitsPerEm, true, 0)
      );
      
      // Convert back to path string
      return this.commandsToPathString(transformedCommands);
      
    } catch (error) {
      console.error('❌ Reverse coordinate transformation failed:', error);
      throw new Error(`Reverse coordinate transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Calculate baseline offset to position glyph properly in OpenType space
   * This ensures the glyph is positioned relative to the baseline (Y=0)
   * rather than floating at the top of the unitsPerEm space
   */
  private static calculateBaselineOffset(commands: SVGPathCommand[], unitsPerEm: number): number {
    // Find the bounding box of the glyph
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (const command of commands) {
      const yCoords = this.getYCoordinateIndices(command.type);
      for (const yIndex of yCoords) {
        if (yIndex < command.coordinates.length) {
          const y = command.coordinates[yIndex];
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Calculate baseline offset
    // We want the glyph to be positioned so that:
    // - The baseline (bottom of glyph) is at Y=0
    // - The glyph extends upward from there
    // - The top of the glyph doesn't exceed unitsPerEm
    
    if (minY === Infinity || maxY === Infinity) {
      return 0; // No valid coordinates found
    }
    
    const glyphHeight = maxY - minY;
    const baselineOffset = Math.max(0, unitsPerEm - glyphHeight - minY);
    
    // Ensure the glyph doesn't extend beyond unitsPerEm
    const adjustedOffset = Math.min(baselineOffset, unitsPerEm - glyphHeight);
    
    console.log(`🔍 Baseline positioning: minY=${minY}, maxY=${maxY}, height=${glyphHeight}, offset=${adjustedOffset}`);
    
    return adjustedOffset;
  }

  /**
   * Transforms a single path command
   */
  private static transformCommand(
    command: SVGPathCommand, 
    unitsPerEm: number, 
    reverse: boolean = false,
    baselineOffset: number = 0
  ): TransformedPathCommand {
    // For SVG to OpenType: y_opentype = baselineOffset + (unitsPerEm - y_svg)
    // For OpenType to SVG: y_svg = unitsPerEm - (y_opentype - baselineOffset)
    const multiplier = reverse ? -1 : 1;
    
    switch (command.type) {
      case 'M': // Move to - 2 coordinates (x, y)
      case 'L': // Line to - 2 coordinates (x, y)
        return {
          type: command.type,
          coordinates: [
            command.coordinates[0], // X unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[1] // Y transformed with baseline
          ],
          relative: command.relative
        };

      case 'H': // Horizontal line - 1 coordinate (x)
        return {
          type: command.type,
          coordinates: [command.coordinates[0]], // X unchanged
          relative: command.relative
        };

      case 'V': // Vertical line - 1 coordinate (y)
        return {
          type: command.type,
          coordinates: [
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[0] // Y transformed with baseline
          ],
          relative: command.relative
        };

      case 'C': // Cubic curve - 6 coordinates (x1, y1, x2, y2, x, y)
        return {
          type: command.type,
          coordinates: [
            command.coordinates[0], // x1 unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[1], // y1 transformed with baseline
            command.coordinates[2], // x2 unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[3], // y2 transformed with baseline
            command.coordinates[4], // x unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[5] // y transformed with baseline
          ],
          relative: command.relative
        };

      case 'S': // Smooth cubic curve - 4 coordinates (x2, y2, x, y)
        return {
          type: command.type,
          coordinates: [
            command.coordinates[0], // x2 unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[1], // y2 transformed with baseline
            command.coordinates[2], // x unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[3] // y transformed with baseline
          ],
          relative: command.relative
        };

      case 'Q': // Quadratic curve - 4 coordinates (x1, y1, x, y)
        return {
          type: command.type,
          coordinates: [
            command.coordinates[0], // x1 unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[1], // y1 transformed with baseline
            command.coordinates[2], // x unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[3] // y transformed with baseline
          ],
          relative: command.relative
        };

      case 'T': // Smooth quadratic curve - 2 coordinates (x, y)
        return {
          type: command.type,
          coordinates: [
            command.coordinates[0], // x unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[1] // y transformed with baseline
          ],
          relative: command.relative
        };

      case 'A': // Arc - 7 coordinates (rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y)
        return {
          type: command.type,
          coordinates: [
            command.coordinates[0], // rx unchanged
            command.coordinates[1], // ry unchanged
            command.coordinates[2], // x-axis-rotation unchanged
            command.coordinates[3], // large-arc-flag unchanged
            command.coordinates[4], // sweep-flag unchanged
            command.coordinates[5], // x unchanged
            baselineOffset + (multiplier * unitsPerEm) - command.coordinates[6] // y transformed with baseline
          ],
          relative: command.relative
        };

      case 'Z': // Close path - no coordinates
        return {
          type: command.type,
          coordinates: [],
          relative: false
        };

      default:
        console.warn(`⚠️ Unknown command type: ${command.type}`);
        return command as TransformedPathCommand;
    }
  }

  /**
   * Parses SVG path string into command objects
   * (Reusing the parsing logic from GlyphConverter)
   */
  private static parseSVGPath(svgPath: string): SVGPathCommand[] {
    const commands: SVGPathCommand[] = [];
    const pathRegex = /([MLHVCSQTAZ])\s*([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = pathRegex.exec(svgPath)) !== null) {
      const type = match[1].toUpperCase() as SVGPathCommand['type'];
      const coordsString = match[2].trim();
      
      if (type === 'Z') {
        commands.push({ type: 'Z', coordinates: [], relative: false });
        continue;
      }

      const coords = coordsString.split(/[\s,]+/).filter(s => s.length > 0).map(Number);
      
      if (coords.length === 0) {
        console.warn(`⚠️ No coordinates found for command ${type}`);
        continue;
      }

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
   * Converts transformed commands back to path string
   */
  private static commandsToPathString(commands: TransformedPathCommand[]): string {
    return commands.map(cmd => {
      if (cmd.type === 'Z') {
        return 'Z';
      }
      
      const coords = cmd.coordinates.join(' ');
      const prefix = cmd.relative ? cmd.type.toLowerCase() : cmd.type;
      
      return `${prefix} ${coords}`;
    }).join(' ');
  }

  /**
   * Validates coordinate transformation
   */
  static validateTransformation(
    originalPath: string, 
    transformedPath: string, 
    unitsPerEm: number
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse both paths
      const originalCommands = this.parseSVGPath(originalPath);
      const transformedCommands = this.parseSVGPath(transformedPath);

      // Check command count
      if (originalCommands.length !== transformedCommands.length) {
        errors.push(`Command count mismatch: ${originalCommands.length} vs ${transformedCommands.length}`);
      }

      // Validate coordinate transformations
      originalCommands.forEach((origCmd, index) => {
        const transCmd = transformedCommands[index];
        if (!transCmd) return;

        if (origCmd.type !== transCmd.type) {
          errors.push(`Command type mismatch at index ${index}: ${origCmd.type} vs ${transCmd.type}`);
        }

        // Check Y-coordinate transformation
        if (origCmd.coordinates.length > 0) {
          const yIndices = this.getYCoordinateIndices(origCmd.type);
          yIndices.forEach(yIndex => {
            if (yIndex < origCmd.coordinates.length && yIndex < transCmd.coordinates.length) {
              const originalY = origCmd.coordinates[yIndex];
              const transformedY = transCmd.coordinates[yIndex];
              const expectedY = unitsPerEm - originalY;
              
              if (Math.abs(transformedY - expectedY) > 0.1) {
                errors.push(`Y-coordinate transformation error at command ${index}: expected ${expectedY}, got ${transformedY}`);
              }
            }
          });
        }
      });

      // Check for potential issues
      if (transformedPath.includes('NaN') || transformedPath.includes('Infinity')) {
        errors.push('Transformed path contains invalid numbers');
      }

      if (transformedPath.length < originalPath.length * 0.8) {
        warnings.push('Transformed path is significantly shorter than original');
      }

    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gets the indices of Y coordinates for a given command type
   */
  private static getYCoordinateIndices(commandType: string): number[] {
    switch (commandType) {
      case 'M':
      case 'L':
        return [1]; // y is at index 1
      case 'V':
        return [0]; // y is at index 0
      case 'C':
        return [1, 3, 5]; // y1, y2, y are at indices 1, 3, 5
      case 'S':
        return [1, 3]; // y2, y are at indices 1, 3
      case 'Q':
        return [1, 3]; // y1, y are at indices 1, 3
      case 'T':
        return [1]; // y is at index 1
      case 'A':
        return [6]; // y is at index 6
      default:
        return [];
    }
  }

  /**
   * Gets transformation statistics for debugging
   */
  static getTransformationStats(
    originalPath: string, 
    transformedPath: string
  ): {
    originalLength: number;
    transformedLength: number;
    commandCount: number;
    coordinateCount: number;
    yTransformations: number;
  } {
        const originalCommands = this.parseSVGPath(originalPath);
    // Note: transformedCommands not used in stats, but parsed for validation
    this.parseSVGPath(transformedPath);
    
    let yTransformations = 0;
    originalCommands.forEach(cmd => {
      yTransformations += this.getYCoordinateIndices(cmd.type).length;
    });
    
    return {
      originalLength: originalPath.length,
      transformedLength: transformedPath.length,
      commandCount: originalCommands.length,
      coordinateCount: originalCommands.reduce((sum, cmd) => sum + cmd.coordinates.length, 0),
      yTransformations
    };
  }
}
