import { GlyphAnalysis } from './FontInspector';

export interface PathComparison {
  unicode: number;
  originalPath: string;
  generatedPath: string;
  coordinateSystem: 'svg' | 'opentype';
  differences: PathDifference[];
  similarity: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface PathDifference {
  type: 'coordinate' | 'command' | 'structure' | 'orientation';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  originalValue: string;
  generatedValue: string;
  suggestion: string;
}

export interface ComparisonReport {
  totalGlyphs: number;
  comparedGlyphs: number;
  averageSimilarity: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  coordinateSystemIssues: number;
  orientationIssues: number;
  comparisons: PathComparison[];
  summary: string;
}

export class PathComparator {
  /**
   * Compares original SVG paths with generated OpenType glyph paths
   */
  static comparePaths(
    originalPaths: Map<number, string>,
    generatedFont: GlyphAnalysis[]
  ): ComparisonReport {
    const comparisons: PathComparison[] = [];
    let totalSimilarity = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;
    let coordinateSystemIssues = 0;
    let orientationIssues = 0;

    console.log('🔍 Starting path comparison...');
    console.log(`  Original paths: ${originalPaths.size}`);
    console.log(`  Generated glyphs: ${generatedFont.length}`);

    generatedFont.forEach(glyph => {
      const originalPath = originalPaths.get(glyph.unicode);
      if (originalPath) {
        const comparison = this.compareSinglePath(glyph.unicode, originalPath, glyph);
        comparisons.push(comparison);
        
        totalSimilarity += comparison.similarity;
        
        // Count issues by severity
        comparison.differences.forEach(diff => {
          switch (diff.severity) {
            case 'critical':
              criticalIssues++;
              break;
            case 'high':
              highIssues++;
              break;
            case 'medium':
              mediumIssues++;
              break;
            case 'low':
              lowIssues++;
              break;
          }
          
          if (diff.type === 'coordinate') coordinateSystemIssues++;
          if (diff.type === 'orientation') orientationIssues++;
        });
      }
    });

    const averageSimilarity = comparisons.length > 0 ? totalSimilarity / comparisons.length : 0;
    
    // Generate summary
    const summary = this.generateSummary(comparisons, {
      totalGlyphs: generatedFont.length,
      comparedGlyphs: comparisons.length,
      averageSimilarity,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      coordinateSystemIssues,
      orientationIssues
    });

    return {
      totalGlyphs: generatedFont.length,
      comparedGlyphs: comparisons.length,
      averageSimilarity: Math.round(averageSimilarity),
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      coordinateSystemIssues,
      orientationIssues,
      comparisons,
      summary
    };
  }

  /**
   * Compares a single original path with its generated counterpart
   */
  private static compareSinglePath(
    unicode: number,
    originalPath: string,
    generatedGlyph: GlyphAnalysis
  ): PathComparison {
    const differences: PathDifference[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    console.log(`🔍 Comparing U+${unicode.toString(16).toUpperCase()}:`);
    console.log(`  Original: ${originalPath.substring(0, 80)}...`);
    console.log(`  Generated: ${generatedGlyph.pathData.substring(0, 80)}...`);

    // 1. Check coordinate system
    const coordinateSystem = this.determinePathCoordinateSystem(generatedGlyph.pathData);
    
    // 2. Check orientation
    const orientationCheck = this.checkOrientation(originalPath, generatedGlyph);
    if (orientationCheck.hasIssue) {
      differences.push(orientationCheck.difference);
      issues.push(orientationCheck.issue);
      recommendations.push(orientationCheck.recommendation);
    }

    // 3. Check coordinate ranges
    const coordinateCheck = this.checkCoordinateRanges(originalPath, generatedGlyph);
    coordinateCheck.differences.forEach(diff => {
      differences.push(diff);
      if (diff.severity === 'critical' || diff.severity === 'high') {
        issues.push(diff.description);
      }
    });
    coordinateCheck.recommendations.forEach(rec => recommendations.push(rec));

    // 4. Check path structure
    const structureCheck = this.checkPathStructure(originalPath, generatedGlyph);
    structureCheck.differences.forEach(diff => {
      differences.push(diff);
      if (diff.severity === 'critical' || diff.severity === 'high') {
        issues.push(diff.description);
      }
    });
    structureCheck.recommendations.forEach(rec => recommendations.push(rec));

    // Calculate similarity score
    const similarity = this.calculateSimilarity(differences);

    return {
      unicode,
      originalPath,
      generatedPath: generatedGlyph.pathData,
      coordinateSystem,
      differences,
      similarity,
      issues,
      recommendations
    };
  }

  /**
   * Determines the coordinate system of a path
   */
  private static determinePathCoordinateSystem(pathData: string): 'svg' | 'opentype' {
    // Extract Y coordinates and analyze their distribution
    const yCoords = this.extractYCoordinates(pathData);
    if (yCoords.length === 0) return 'svg';

    const avgY = yCoords.reduce((sum, y) => sum + y, 0) / yCoords.length;
    const maxY = Math.max(...yCoords);
    const minY = Math.min(...yCoords);

    // SVG typically has Y coordinates in smaller ranges (0-200 for 200x200 viewBox)
    // OpenType typically has Y coordinates in larger ranges (0-1000 for 1000 units per em)
    if (maxY > 500 && avgY > 400) {
      return 'opentype';
    } else {
      return 'svg';
    }
  }

  /**
   * Checks if the orientation is correct
   */
  private static checkOrientation(
    originalPath: string,
    generatedGlyph: GlyphAnalysis
  ): {
    hasIssue: boolean;
    difference?: PathDifference;
    issue?: string;
    recommendation?: string;
  } {
    const originalYRange = this.getYCoordinateRange(originalPath);
    const generatedYRange = generatedGlyph.yCoordinateRange;

    // Check if Y coordinates are flipped correctly
    // Original SVG: Y increases downward (smaller values at top)
    // Generated OpenType: Y should increase upward (larger values at top)
    
    if (originalYRange.max < generatedYRange.max && originalYRange.min < generatedYRange.min) {
      // Y coordinates seem to be in the same direction - this might indicate an issue
      return {
        hasIssue: true,
        difference: {
          type: 'orientation',
          description: 'Y-axis orientation may not be correctly flipped',
          severity: 'high',
          originalValue: `Y range: ${originalYRange.min} to ${originalYRange.max}`,
          generatedValue: `Y range: ${generatedYRange.min} to ${generatedYRange.max}`,
          suggestion: 'Check coordinate transformation logic - Y-axis should be flipped'
        },
        issue: 'Y-axis orientation mismatch detected',
        recommendation: 'Verify coordinate transformation is correctly flipping Y-axis'
      };
    }

    return { hasIssue: false };
  }

  /**
   * Checks coordinate ranges for consistency
   */
  private static checkCoordinateRanges(
    originalPath: string,
    generatedGlyph: GlyphAnalysis
  ): {
    differences: PathDifference[];
    recommendations: string[];
  } {
    const differences: PathDifference[] = [];
    const recommendations: string[] = [];

    const originalYRange = this.getYCoordinateRange(originalPath);
    const generatedYRange = generatedGlyph.yCoordinateRange;

    // Check if Y coordinates are within expected OpenType range (typically 0-1000)
    if (generatedYRange.min < 0 || generatedYRange.max > 1200) {
      differences.push({
        type: 'coordinate',
        description: 'Y coordinates outside expected OpenType range',
        severity: 'medium',
        originalValue: `Y range: ${originalYRange.min} to ${originalYRange.max}`,
        generatedValue: `Y range: ${generatedYRange.min} to ${generatedYRange.max}`,
        suggestion: 'Y coordinates should typically be between 0 and 1000 for OpenType fonts'
      });
      recommendations.push('Normalize Y coordinates to OpenType standard range');
    }

    // Check for extreme coordinate values that might indicate transformation errors
    if (Math.abs(generatedYRange.max - generatedYRange.min) > 1500) {
      differences.push({
        type: 'coordinate',
        description: 'Y coordinate range is unusually large',
        severity: 'low',
        originalValue: `Y range: ${originalYRange.max - originalYRange.min}`,
        generatedValue: `Y range: ${generatedYRange.max - generatedYRange.min}`,
        suggestion: 'Large Y ranges may indicate coordinate transformation issues'
      });
    }

    return { differences, recommendations };
  }

  /**
   * Checks path structure integrity
   */
  private static checkPathStructure(
    originalPath: string,
    generatedGlyph: GlyphAnalysis
  ): {
    differences: PathDifference[];
    recommendations: string[];
  } {
    const differences: PathDifference[] = [];
    const recommendations: string[] = [];

    // Check if path has reasonable command count
    if (generatedGlyph.pathCommands.length === 0) {
      differences.push({
        type: 'structure',
        description: 'Generated path has no commands',
        severity: 'critical',
        originalValue: `Commands: ${this.countPathCommands(originalPath)}`,
        generatedValue: 'Commands: 0',
        suggestion: 'Path generation failed - check vectorization and conversion process'
      });
      recommendations.push('Investigate path generation pipeline');
    }

    // Check if path is closed
    const isClosed = generatedGlyph.pathData.includes('Z') || generatedGlyph.pathData.includes('z');
    if (!isClosed) {
      differences.push({
        type: 'structure',
        description: 'Generated path is not closed',
        severity: 'medium',
        originalValue: 'Path should be closed',
        generatedValue: 'Path is open',
        suggestion: 'Ensure paths are properly closed for font glyphs'
      });
      recommendations.push('Add path closure commands where needed');
    }

    return { differences, recommendations };
  }

  /**
   * Calculates similarity score based on differences
   */
  private static calculateSimilarity(differences: PathDifference[]): number {
    if (differences.length === 0) return 100;

    let penalty = 0;
    differences.forEach(diff => {
      switch (diff.severity) {
        case 'critical':
          penalty += 30;
          break;
        case 'high':
          penalty += 20;
          break;
        case 'medium':
          penalty += 10;
          break;
        case 'low':
          penalty += 5;
          break;
      }
    });

    return Math.max(0, 100 - penalty);
  }

  /**
   * Extracts Y coordinates from a path string
   */
  private static extractYCoordinates(pathData: string): number[] {
    const yCoords: number[] = [];
    const pathRegex = /([MLHVCSQTAZ])\s*([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = pathRegex.exec(pathData)) !== null) {
      const type = match[1].toUpperCase();
      const coordsString = match[2].trim();
      
      if (type === 'Z') continue;

      const coords = coordsString.split(/[\s,]+/).filter(s => s.length > 0).map(Number);
      
      switch (type) {
        case 'M':
        case 'L':
          if (coords.length >= 2) yCoords.push(coords[1]);
          break;
        case 'V':
          if (coords.length >= 1) yCoords.push(coords[0]);
          break;
        case 'C':
          if (coords.length >= 6) {
            yCoords.push(coords[1], coords[3], coords[5]);
          }
          break;
        case 'S':
          if (coords.length >= 4) {
            yCoords.push(coords[1], coords[3]);
          }
          break;
        case 'Q':
          if (coords.length >= 4) {
            yCoords.push(coords[1], coords[3]);
          }
          break;
        case 'T':
          if (coords.length >= 2) yCoords.push(coords[1]);
          break;
        case 'A':
          if (coords.length >= 7) yCoords.push(coords[6]);
          break;
      }
    }

    return yCoords;
  }

  /**
   * Gets Y coordinate range from a path
   */
  private static getYCoordinateRange(pathData: string): { min: number; max: number } {
    const yCoords = this.extractYCoordinates(pathData);
    if (yCoords.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...yCoords),
      max: Math.max(...yCoords)
    };
  }

  /**
   * Counts path commands in a path string
   */
  private static countPathCommands(pathData: string): number {
    const commandRegex = /[MLHVCSQTAZ]/gi;
    const matches = pathData.match(commandRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Generates a summary report
   */
  private static generateSummary(
    comparisons: PathComparison[],
    stats: {
      totalGlyphs: number;
      comparedGlyphs: number;
      averageSimilarity: number;
      criticalIssues: number;
      highIssues: number;
      mediumIssues: number;
      lowIssues: number;
      coordinateSystemIssues: number;
      orientationIssues: number;
    }
  ): string {
    let summary = `Path Comparison Summary\n`;
    summary += `========================\n\n`;
    
    summary += `Overview:\n`;
    summary += `- Total glyphs: ${stats.totalGlyphs}\n`;
    summary += `- Compared glyphs: ${stats.comparedGlyphs}\n`;
    summary += `- Average similarity: ${stats.averageSimilarity}%\n\n`;
    
    summary += `Issues by Severity:\n`;
    summary += `- Critical: ${stats.criticalIssues}\n`;
    summary += `- High: ${stats.highIssues}\n`;
    summary += `- Medium: ${stats.mediumIssues}\n`;
    summary += `- Low: ${stats.lowIssues}\n\n`;
    
    summary += `Specific Problem Areas:\n`;
    summary += `- Coordinate system issues: ${stats.coordinateSystemIssues}\n`;
    summary += `- Orientation issues: ${stats.orientationIssues}\n\n`;
    
    if (stats.criticalIssues > 0) {
      summary += `🚨 CRITICAL: ${stats.criticalIssues} critical issues detected!\n`;
      summary += `   These must be fixed before the font can be used.\n\n`;
    }
    
    if (stats.highIssues > 0) {
      summary += `⚠️ HIGH: ${stats.highIssues} high-priority issues detected.\n`;
      summary += `   These should be addressed for proper font functionality.\n\n`;
    }
    
    if (stats.averageSimilarity < 80) {
      summary += `📉 QUALITY: Overall similarity is ${stats.averageSimilarity}%.\n`;
      summary += `   Consider reviewing the font generation pipeline.\n\n`;
    } else {
      summary += `✅ QUALITY: Overall similarity is ${stats.averageSimilarity}%.\n`;
      summary += `   Font generation appears to be working well.\n\n`;
    }
    
    return summary;
  }
}
