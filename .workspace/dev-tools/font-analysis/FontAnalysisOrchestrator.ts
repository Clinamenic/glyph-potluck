import { FontInspector, FontAnalysis, GlyphAnalysis } from './FontInspector';
import { PathComparator, ComparisonReport } from './PathComparator';

export interface FontAnalysisResult {
  fontAnalysis: FontAnalysis;
  pathComparison: ComparisonReport;
  timestamp: Date;
  summary: {
    overallQuality: number;
    criticalIssues: number;
    recommendations: string[];
    nextSteps: string[];
  };
}

export interface AnalysisOptions {
  includeDetailedGlyphs: boolean;
  includePathComparison: boolean;
  includeQualityMetrics: boolean;
  exportFormats: ('text' | 'json' | 'html')[];
}

export class FontAnalysisOrchestrator {
  /**
   * Performs comprehensive font analysis including path comparison
   */
  static async analyzeFontComprehensive(
    fontFile: File,
    originalPaths: Map<number, string>,
    options: AnalysisOptions = {
      includeDetailedGlyphs: true,
      includePathComparison: true,
      includeQualityMetrics: true,
      exportFormats: ['text']
    }
  ): Promise<FontAnalysisResult> {
    console.log('🚀 Starting comprehensive font analysis...');
    
    try {
      // Step 1: Analyze the generated font
      const fontAnalysis = await FontInspector.analyzeFont(fontFile);
      console.log('✅ Font analysis completed');
      
      // Step 2: Compare paths if requested
      let pathComparison: ComparisonReport | null = null;
      if (options.includePathComparison && originalPaths.size > 0) {
        console.log('🔍 Starting path comparison...');
        pathComparison = PathComparator.comparePaths(originalPaths, fontAnalysis.glyphs);
        console.log('✅ Path comparison completed');
      }
      
      // Step 3: Generate comprehensive summary
      const summary = this.generateComprehensiveSummary(fontAnalysis, pathComparison);
      
      const result: FontAnalysisResult = {
        fontAnalysis,
        pathComparison: pathComparison || this.createEmptyComparisonReport(),
        timestamp: new Date(),
        summary
      };
      
      console.log('🎯 Comprehensive analysis completed');
      return result;
      
    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
      throw new Error(`Font analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes only the font file (without path comparison)
   */
  static async analyzeFontOnly(fontFile: File): Promise<FontAnalysis> {
    console.log('🔍 Starting font-only analysis...');
    return await FontInspector.analyzeFont(fontFile);
  }

  /**
   * Compares paths only (requires pre-analyzed font)
   */
  static comparePathsOnly(
    originalPaths: Map<number, string>,
    fontAnalysis: FontAnalysis
  ): ComparisonReport {
    console.log('🔍 Starting path-only comparison...');
    return PathComparator.comparePaths(originalPaths, fontAnalysis.glyphs);
  }

  /**
   * Generates a comprehensive summary of the analysis
   */
  private static generateComprehensiveSummary(
    fontAnalysis: FontAnalysis,
    pathComparison: ComparisonReport | null
  ): {
    overallQuality: number;
    criticalIssues: number;
    recommendations: string[];
    nextSteps: string[];
  } {
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    let criticalIssues = 0;
    
    // Font quality assessment
    if (fontAnalysis.qualityMetrics.overallScore < 80) {
      recommendations.push('Font quality is below optimal threshold - review generation pipeline');
      nextSteps.push('Investigate font generation quality issues');
    }
    
    if (fontAnalysis.coordinateSystem === 'unknown') {
      recommendations.push('Coordinate system could not be determined - check glyph data');
      criticalIssues++;
    }
    
    // Path comparison assessment
    if (pathComparison) {
      criticalIssues += pathComparison.criticalIssues;
      
      if (pathComparison.criticalIssues > 0) {
        recommendations.push(`${pathComparison.criticalIssues} critical path issues detected`);
        nextSteps.push('Fix critical path generation issues before using font');
      }
      
      if (pathComparison.orientationIssues > 0) {
        recommendations.push(`${pathComparison.orientationIssues} orientation issues detected`);
        nextSteps.push('Review coordinate transformation logic');
      }
      
      if (pathComparison.averageSimilarity < 80) {
        recommendations.push('Path similarity is below optimal threshold');
        nextSteps.push('Review vectorization and conversion quality');
      }
    }
    
    // Calculate overall quality
    const fontQuality = fontAnalysis.qualityMetrics.overallScore;
    const pathQuality = pathComparison ? pathComparison.averageSimilarity : 100;
    const overallQuality = Math.round((fontQuality + pathQuality) / 2);
    
    // Add general recommendations
    if (fontAnalysis.glyphCount === 0) {
      recommendations.push('No glyphs found in font - check generation process');
      criticalIssues++;
    }
    
    if (fontAnalysis.unitsPerEm !== 1000) {
      recommendations.push('Font uses non-standard units per em - may cause compatibility issues');
    }
    
    return {
      overallQuality,
      criticalIssues,
      recommendations,
      nextSteps
    };
  }

  /**
   * Creates an empty comparison report for cases where comparison is skipped
   */
  private static createEmptyComparisonReport(): ComparisonReport {
    return {
      totalGlyphs: 0,
      comparedGlyphs: 0,
      averageSimilarity: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      coordinateSystemIssues: 0,
      orientationIssues: 0,
      comparisons: [],
      summary: 'Path comparison was not performed'
    };
  }

  /**
   * Exports analysis results in various formats
   */
  static exportResults(
    results: FontAnalysisResult,
    format: 'text' | 'json' | 'html'
  ): string {
    switch (format) {
      case 'text':
        return this.exportAsText(results);
      case 'json':
        return this.exportAsJSON(results);
      case 'html':
        return this.exportAsHTML(results);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Exports results as formatted text
   */
  private static exportAsText(results: FontAnalysisResult): string {
    let output = `Font Analysis Report\n`;
    output += `===================\n`;
    output += `Generated: ${results.timestamp.toISOString()}\n\n`;
    
    // Summary
    output += `SUMMARY\n`;
    output += `-------\n`;
    output += `Overall Quality: ${results.summary.overallQuality}%\n`;
    output += `Critical Issues: ${results.summary.criticalIssues}\n\n`;
    
    if (results.summary.recommendations.length > 0) {
      output += `RECOMMENDATIONS\n`;
      output += `---------------\n`;
      results.summary.recommendations.forEach(rec => {
        output += `• ${rec}\n`;
      });
      output += `\n`;
    }
    
    if (results.summary.nextSteps.length > 0) {
      output += `NEXT STEPS\n`;
      output += `-----------\n`;
      results.summary.nextSteps.forEach(step => {
        output += `• ${step}\n`;
      });
      output += `\n`;
    }
    
    // Font analysis
    output += `FONT ANALYSIS\n`;
    output += `--------------\n`;
    output += FontInspector.exportAnalysis(results.fontAnalysis);
    
    // Path comparison
    if (results.pathComparison.comparisons.length > 0) {
      output += `\nPATH COMPARISON\n`;
      output += `----------------\n`;
      output += results.pathComparison.summary;
    }
    
    return output;
  }

  /**
   * Exports results as JSON
   */
  private static exportAsJSON(results: FontAnalysisResult): string {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Exports results as HTML
   */
  private static exportAsHTML(results: FontAnalysisResult): string {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Font Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .critical { color: #d32f2f; font-weight: bold; }
        .high { color: #f57c00; font-weight: bold; }
        .medium { color: #fbc02d; font-weight: bold; }
        .low { color: #388e3c; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Font Analysis Report</h1>
        <p>Generated: ${results.timestamp.toISOString()}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <div class="metric">Overall Quality: ${results.summary.overallQuality}%</div>
        <div class="metric">Critical Issues: ${results.summary.criticalIssues}</div>
    </div>`;
    
    if (results.summary.recommendations.length > 0) {
      html += `
    <div class="section">
        <h2>Recommendations</h2>
        <ul>`;
      results.summary.recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += `
        </ul>
    </div>`;
    }
    
    html += `
    <div class="section">
        <h2>Font Analysis</h2>
        <div class="metric">Font Name: ${results.fontAnalysis.fontName}</div>
        <div class="metric">Glyph Count: ${results.fontAnalysis.glyphCount}</div>
        <div class="metric">Coordinate System: ${results.fontAnalysis.coordinateSystem}</div>
        <div class="metric">Quality Score: ${results.fontAnalysis.qualityMetrics.overallScore}%</div>
    </div>`;
    
    if (results.pathComparison.comparisons.length > 0) {
      html += `
    <div class="section">
        <h2>Path Comparison</h2>
        <div class="metric">Average Similarity: ${results.pathComparison.averageSimilarity}%</div>
        <div class="metric">Critical Issues: ${results.pathComparison.criticalIssues}</div>
        <div class="metric">High Issues: ${results.pathComparison.highIssues}</div>
    </div>`;
    }
    
    html += `
</body>
</html>`;
    
    return html;
  }

  /**
   * Validates analysis results for consistency
   */
  static validateResults(results: FontAnalysisResult): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for critical issues
    if (results.summary.criticalIssues > 0) {
      errors.push(`${results.summary.criticalIssues} critical issues detected`);
    }
    
    // Check font analysis
    if (results.fontAnalysis.glyphCount === 0) {
      errors.push('No glyphs found in font analysis');
    }
    
    if (results.fontAnalysis.coordinateSystem === 'unknown') {
      warnings.push('Coordinate system could not be determined');
    }
    
    // Check path comparison
    if (results.pathComparison.comparisons.length > 0) {
      if (results.pathComparison.criticalIssues > 0) {
        errors.push(`${results.pathComparison.criticalIssues} critical path issues detected`);
      }
      
      if (results.pathComparison.averageSimilarity < 70) {
        warnings.push('Path similarity is very low - significant issues detected');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
