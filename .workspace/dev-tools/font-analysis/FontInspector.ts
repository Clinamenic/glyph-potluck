import * as opentype from 'opentype.js';

export interface GlyphAnalysis {
  unicode: number;
  name: string;
  pathData: string;
  boundingBox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  advanceWidth: number;
  pathCommands: PathCommand[];
  coordinateCount: number;
  yCoordinateRange: {
    min: number;
    max: number;
  };
}

export interface PathCommand {
  type: string;
  coordinates: number[];
  relative: boolean;
}

export interface FontAnalysis {
  fontName: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  xHeight: number;
  capHeight: number;
  glyphCount: number;
  glyphs: GlyphAnalysis[];
  coordinateSystem: 'y-up' | 'y-down' | 'unknown';
  qualityMetrics: {
    coordinateConsistency: number;
    pathIntegrity: number;
    overallScore: number;
  };
}

export class FontInspector {
  /**
   * Analyzes a font file and extracts detailed glyph information
   */
  static async analyzeFont(fontFile: File): Promise<FontAnalysis> {
    try {
      const arrayBuffer = await fontFile.arrayBuffer();
      const font = await opentype.parse(arrayBuffer);
      
      console.log('🔍 Font analysis started:', font.names.fontFamily);
      
      const glyphs: GlyphAnalysis[] = [];
      let totalCoordinateCount = 0;
      let yCoordinates: number[] = [];
      
      // Analyze each glyph
      font.glyphs.glyphs.forEach((glyph, unicode) => {
        if (glyph && glyph.path) {
          const analysis = this.analyzeGlyph(glyph, unicode);
          glyphs.push(analysis);
          
          totalCoordinateCount += analysis.coordinateCount;
          yCoordinates.push(...analysis.yCoordinateRange.min, analysis.yCoordinateRange.max);
        }
      });
      
      // Determine coordinate system
      const coordinateSystem = this.determineCoordinateSystem(yCoordinates, font.unitsPerEm);
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(glyphs, font.unitsPerEm);
      
      const result: FontAnalysis = {
        fontName: font.names.fontFamily || 'Unknown',
        unitsPerEm: font.unitsPerEm,
        ascender: font.ascender,
        descender: font.descender,
        xHeight: font.xHeight || 0,
        capHeight: font.capHeight || 0,
        glyphCount: glyphs.length,
        glyphs,
        coordinateSystem,
        qualityMetrics
      };
      
      console.log('✅ Font analysis completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Font analysis failed:', error);
      throw new Error(`Font analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes a single glyph
   */
  private static analyzeGlyph(glyph: opentype.Glyph, unicode: number): GlyphAnalysis {
    const path = glyph.path;
    const pathData = path.toPathData();
    
    // Parse path commands
    const pathCommands = this.parsePathCommands(pathData);
    
    // Calculate bounding box
    const bbox = path.getBoundingBox();
    const boundingBox = {
      x1: bbox.x1,
      y1: bbox.y1,
      x2: bbox.x2,
      y2: bbox.y2
    };
    
    // Extract Y coordinates for analysis
    const yCoordinates = this.extractYCoordinates(pathCommands);
    const yCoordinateRange = {
      min: Math.min(...yCoordinates),
      max: Math.max(...yCoordinates)
    };
    
    return {
      unicode,
      name: glyph.name || `uni${unicode.toString(16).toUpperCase()}`,
      pathData,
      boundingBox,
      advanceWidth: glyph.advanceWidth || 0,
      pathCommands,
      coordinateCount: pathCommands.reduce((sum, cmd) => sum + cmd.coordinates.length, 0),
      yCoordinateRange
    };
  }

  /**
   * Parses SVG path commands into structured data
   */
  private static parsePathCommands(pathData: string): PathCommand[] {
    const commands: PathCommand[] = [];
    const pathRegex = /([MLHVCSQTAZ])\s*([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = pathRegex.exec(pathData)) !== null) {
      const type = match[1].toUpperCase();
      const coordsString = match[2].trim();
      
      if (type === 'Z') {
        commands.push({ type: 'Z', coordinates: [], relative: false });
        continue;
      }

      const coords = coordsString.split(/[\s,]+/).filter(s => s.length > 0).map(Number);
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
   * Extracts Y coordinates from path commands
   */
  private static extractYCoordinates(pathCommands: PathCommand[]): number[] {
    const yCoords: number[] = [];
    
    pathCommands.forEach(cmd => {
      switch (cmd.type) {
        case 'M':
        case 'L':
          if (cmd.coordinates.length >= 2) {
            yCoords.push(cmd.coordinates[1]);
          }
          break;
        case 'V':
          if (cmd.coordinates.length >= 1) {
            yCoords.push(cmd.coordinates[0]);
          }
          break;
        case 'C':
          if (cmd.coordinates.length >= 6) {
            yCoords.push(cmd.coordinates[1], cmd.coordinates[3], cmd.coordinates[5]);
          }
          break;
        case 'S':
          if (cmd.coordinates.length >= 4) {
            yCoords.push(cmd.coordinates[1], cmd.coordinates[3]);
          }
          break;
        case 'Q':
          if (cmd.coordinates.length >= 4) {
            yCoords.push(cmd.coordinates[1], cmd.coordinates[3]);
          }
          break;
        case 'T':
          if (cmd.coordinates.length >= 2) {
            yCoords.push(cmd.coordinates[1]);
          }
          break;
        case 'A':
          if (cmd.coordinates.length >= 7) {
            yCoords.push(cmd.coordinates[6]);
          }
          break;
      }
    });
    
    return yCoords;
  }

  /**
   * Determines the coordinate system used in the font
   */
  private static determineCoordinateSystem(yCoordinates: number[], unitsPerEm: number): 'y-up' | 'y-down' | 'unknown' {
    if (yCoordinates.length === 0) return 'unknown';
    
    const avgY = yCoordinates.reduce((sum, y) => sum + y, 0) / yCoordinates.length;
    const maxY = Math.max(...yCoordinates);
    const minY = Math.min(...yCoordinates);
    
    // Y-up: Y coordinates are typically positive and increase upward
    // Y-down: Y coordinates are typically negative or small positive values
    if (avgY > unitsPerEm * 0.5 && maxY > unitsPerEm * 0.8) {
      return 'y-up';
    } else if (avgY < unitsPerEm * 0.5 && minY < unitsPerEm * 0.2) {
      return 'y-down';
    }
    
    return 'unknown';
  }

  /**
   * Calculates quality metrics for the font
   */
  private static calculateQualityMetrics(glyphs: GlyphAnalysis[], unitsPerEm: number): {
    coordinateConsistency: number;
    pathIntegrity: number;
    overallScore: number;
  } {
    if (glyphs.length === 0) {
      return { coordinateConsistency: 0, pathIntegrity: 0, overallScore: 0 };
    }
    
    // Coordinate consistency: Check if Y coordinates are in expected ranges
    let consistentGlyphs = 0;
    glyphs.forEach(glyph => {
      const { min, max } = glyph.yCoordinateRange;
      if (min >= 0 && max <= unitsPerEm) {
        consistentGlyphs++;
      }
    });
    const coordinateConsistency = consistentGlyphs / glyphs.length;
    
    // Path integrity: Check if paths have reasonable command counts
    let validPaths = 0;
    glyphs.forEach(glyph => {
      if (glyph.pathCommands.length > 0 && glyph.coordinateCount > 0) {
        validPaths++;
      }
    });
    const pathIntegrity = validPaths / glyphs.length;
    
    // Overall score: Weighted average
    const overallScore = (coordinateConsistency * 0.6) + (pathIntegrity * 0.4);
    
    return {
      coordinateConsistency: Math.round(coordinateConsistency * 100),
      pathIntegrity: Math.round(pathIntegrity * 100),
      overallScore: Math.round(overallScore * 100)
    };
  }

  /**
   * Exports analysis results to a readable format
   */
  static exportAnalysis(analysis: FontAnalysis): string {
    let output = `Font Analysis Report: ${analysis.fontName}\n`;
    output += `=====================================\n\n`;
    
    output += `Font Metrics:\n`;
    output += `- Units per Em: ${analysis.unitsPerEm}\n`;
    output += `- Ascender: ${analysis.ascender}\n`;
    output += `- Descender: ${analysis.descender}\n`;
    output += `- X-Height: ${analysis.xHeight}\n`;
    output += `- Cap Height: ${analysis.capHeight}\n`;
    output += `- Glyph Count: ${analysis.glyphCount}\n`;
    output += `- Coordinate System: ${analysis.coordinateSystem}\n\n`;
    
    output += `Quality Metrics:\n`;
    output += `- Coordinate Consistency: ${analysis.qualityMetrics.coordinateConsistency}%\n`;
    output += `- Path Integrity: ${analysis.qualityMetrics.pathIntegrity}%\n`;
    output += `- Overall Score: ${analysis.qualityMetrics.overallScore}%\n\n`;
    
    output += `Glyph Details:\n`;
    output += `==============\n\n`;
    
    analysis.glyphs.forEach(glyph => {
      output += `U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')} (${glyph.name}):\n`;
      output += `  Bounding Box: (${glyph.boundingBox.x1}, ${glyph.boundingBox.y1}) to (${glyph.boundingBox.x2}, ${glyph.boundingBox.y2})\n`;
      output += `  Advance Width: ${glyph.advanceWidth}\n`;
      output += `  Y Range: ${glyph.yCoordinateRange.min} to ${glyph.yCoordinateRange.max}\n`;
      output += `  Path: ${glyph.pathData.substring(0, 100)}${glyph.pathData.length > 100 ? '...' : ''}\n\n`;
    });
    
    return output;
  }
}
