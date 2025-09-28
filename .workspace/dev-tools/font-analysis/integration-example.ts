// Integration Example for Font Analysis Tools
// This shows how to integrate the analysis tools into the main application

import { FontAnalysisOrchestrator } from './index';

/**
 * Example integration with the main font generation workflow
 * Add this to your FontCreationInterface or wherever you handle font generation
 */

export class FontAnalysisIntegration {
  /**
   * Analyzes a generated font and provides feedback
   * Call this after successful font generation
   */
  static async analyzeGeneratedFont(
    fontFile: File,
    vectorizedCharacters: Array<{ unicode: number; vectorData: string }>
  ) {
    try {
      console.log('🔍 Starting font analysis...');
      
      // Convert vectorized characters to path map
      const originalPaths = new Map<number, string>();
      vectorizedCharacters.forEach(char => {
        if (char.vectorData) {
          originalPaths.set(char.unicode, char.vectorData);
        }
      });
      
      console.log(`📊 Analyzing font with ${originalPaths.size} original paths`);
      
      // Perform comprehensive analysis
      const results = await FontAnalysisOrchestrator.analyzeFontComprehensive(
        fontFile,
        originalPaths,
        {
          includeDetailedGlyphs: true,
          includePathComparison: true,
          includeQualityMetrics: true,
          exportFormats: ['text', 'json']
        }
      );
      
      // Display results
      this.displayAnalysisResults(results);
      
      // Check for critical issues
      if (results.summary.criticalIssues > 0) {
        console.error('🚨 CRITICAL ISSUES DETECTED:', results.summary.recommendations);
        return {
          success: false,
          criticalIssues: results.summary.criticalIssues,
          recommendations: results.summary.recommendations
        };
      }
      
      // Check for high priority issues
      if (results.summary.recommendations.length > 0) {
        console.warn('⚠️ Issues detected:', results.summary.recommendations);
        return {
          success: true,
          warnings: results.summary.recommendations,
          quality: results.summary.overallQuality
        };
      }
      
      console.log('✅ Font analysis completed successfully');
      return {
        success: true,
        quality: results.summary.overallQuality
      };
      
    } catch (error) {
      console.error('❌ Font analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Displays analysis results in the console and optionally in the UI
   */
  private static displayAnalysisResults(results: any) {
    // Console output
    console.log('📋 Font Analysis Results:');
    console.log('==========================');
    console.log(`Overall Quality: ${results.summary.overallQuality}%`);
    console.log(`Critical Issues: ${results.summary.criticalIssues}`);
    console.log(`Font Name: ${results.fontAnalysis.fontName}`);
    console.log(`Glyph Count: ${results.fontAnalysis.glyphCount}`);
    console.log(`Coordinate System: ${results.fontAnalysis.coordinateSystem}`);
    
    if (results.pathComparison.comparisons.length > 0) {
      console.log(`Path Similarity: ${results.pathComparison.averageSimilarity}%`);
      console.log(`Orientation Issues: ${results.pathComparison.orientationIssues}`);
    }
    
    // Export detailed report
    const textReport = FontAnalysisOrchestrator.exportResults(results, 'text');
    console.log('\n📄 Detailed Report:');
    console.log(textReport);
    
    // You could also display this in the UI
    // this.showAnalysisModal(results);
  }
  
  /**
   * Quick quality check - returns true if font meets quality standards
   */
  static async quickQualityCheck(fontFile: File): Promise<boolean> {
    try {
      const analysis = await FontAnalysisOrchestrator.analyzeFontOnly(fontFile);
      
      // Basic quality thresholds
      const hasGlyphs = analysis.glyphCount > 0;
      const goodQuality = analysis.qualityMetrics.overallScore >= 80;
      const knownCoordinateSystem = analysis.coordinateSystem !== 'unknown';
      
      return hasGlyphs && goodQuality && knownCoordinateSystem;
      
    } catch (error) {
      console.error('Quick quality check failed:', error);
      return false;
    }
  }
  
  /**
   * Gets specific glyph analysis for debugging
   */
  static async analyzeSpecificGlyph(
    fontFile: File,
    unicode: number
  ) {
    try {
      const analysis = await FontAnalysisOrchestrator.analyzeFontOnly(fontFile);
      const glyph = analysis.glyphs.find(g => g.unicode === unicode);
      
      if (glyph) {
        console.log(`🔍 Glyph U+${unicode.toString(16).toUpperCase()}:`);
        console.log(`  Name: ${glyph.name}`);
        console.log(`  Bounding Box: (${glyph.boundingBox.x1}, ${glyph.boundingBox.y1}) to (${glyph.boundingBox.x2}, ${glyph.boundingBox.y2})`);
        console.log(`  Y Range: ${glyph.yCoordinateRange.min} to ${glyph.yCoordinateRange.max}`);
        console.log(`  Path: ${glyph.pathData.substring(0, 100)}...`);
        return glyph;
      } else {
        console.warn(`Glyph U+${unicode.toString(16).toUpperCase()} not found`);
        return null;
      }
      
    } catch (error) {
      console.error('Glyph analysis failed:', error);
      return null;
    }
  }
}

/**
 * Example usage in your component:
 */

/*
// In your FontCreationInterface or similar component:

import { FontAnalysisIntegration } from '.workspace/dev-tools/font-analysis/integration-example';

// After successful font generation:
const handleFontGenerated = async (fontFile: File) => {
  // Your existing font generation logic...
  
  // Add analysis
  const analysisResult = await FontAnalysisIntegration.analyzeGeneratedFont(
    fontFile,
    vectorizedCharacters
  );
  
  if (!analysisResult.success) {
    // Handle critical issues
    console.error('Font has critical issues:', analysisResult.recommendations);
    // Show error message to user
  } else if (analysisResult.warnings) {
    // Handle warnings
    console.warn('Font has warnings:', analysisResult.warnings);
    // Show warning message to user
  } else {
    // Font is good quality
    console.log('Font quality:', analysisResult.quality);
    // Proceed with font export
  }
};

// Quick quality check before export:
const isFontGood = await FontAnalysisIntegration.quickQualityCheck(fontFile);
if (isFontGood) {
  // Proceed with export
} else {
  // Warn user about quality issues
}

// Debug specific glyph:
const glyphAnalysis = await FontAnalysisIntegration.analyzeSpecificGlyph(fontFile, 65); // A
if (glyphAnalysis) {
  console.log('Glyph A analysis:', glyphAnalysis);
}
*/
