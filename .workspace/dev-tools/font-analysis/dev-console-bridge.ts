// Dev Console Bridge
// This allows the dev tools to access the main application data
// without requiring imports in the main app

import { FontAnalysisOrchestrator } from './index';

/**
 * Bridge class that provides access to main application data
 * Access this through the browser console for debugging
 */
export class DevConsoleBridge {
  private static instance: DevConsoleBridge;
  
  private constructor() {
    // Make this accessible globally
    (window as any).FontDevTools = this;
    console.log('🔧 Font Dev Tools loaded. Access via: window.FontDevTools');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): DevConsoleBridge {
    if (!DevConsoleBridge.instance) {
      DevConsoleBridge.instance = new DevConsoleBridge();
    }
    return DevConsoleBridge.instance;
  }
  
  /**
   * Analyze the currently generated font (if any)
   * Call this after font generation to examine the result
   */
  async analyzeCurrentFont(): Promise<any> {
    try {
      // Try to find the font file in the app's state
      const fontFile = this.getCurrentFontFile();
      if (!fontFile) {
        throw new Error('No font file found. Generate a font first.');
      }
      
      // Get original paths from the app's state
      const originalPaths = this.getOriginalPaths();
      if (originalPaths.size === 0) {
        throw new Error('No original paths found. Vectorize some characters first.');
      }
      
      console.log('🔍 Analyzing current font...');
      console.log(`  Font file: ${fontFile.name} (${fontFile.size} bytes)`);
      console.log(`  Original paths: ${originalPaths.size} characters`);
      
      // Perform comprehensive analysis
      const results = await FontAnalysisOrchestrator.analyzeFontComprehensive(
        fontFile,
        originalPaths
      );
      
      // Display results
      this.displayAnalysisResults(results);
      
      return results;
      
    } catch (error) {
      console.error('❌ Font analysis failed:', error);
      throw error;
    }
  }
  
  /**
   * Quick quality check of the current font
   */
  async quickQualityCheck(): Promise<boolean> {
    try {
      const fontFile = this.getCurrentFontFile();
      if (!fontFile) {
        console.warn('⚠️ No font file found');
        return false;
      }
      
      const analysis = await FontAnalysisOrchestrator.analyzeFontOnly(fontFile);
      
      const quality = analysis.qualityMetrics.overallScore;
      const hasGlyphs = analysis.glyphCount > 0;
      const coordinateSystem = analysis.coordinateSystem;
      
      console.log('📊 Quick Quality Check:');
      console.log(`  Quality Score: ${quality}%`);
      console.log(`  Glyph Count: ${analysis.glyphCount}`);
      console.log(`  Coordinate System: ${coordinateSystem}`);
      
      return quality >= 80 && hasGlyphs && coordinateSystem !== 'unknown';
      
    } catch (error) {
      console.error('❌ Quick quality check failed:', error);
      return false;
    }
  }
  
  /**
   * Analyze a specific character's transformation
   */
  async analyzeCharacter(unicode: number): Promise<any> {
    try {
      const fontFile = this.getCurrentFontFile();
      if (!fontFile) {
        throw new Error('No font file found');
      }
      
      const analysis = await FontAnalysisOrchestrator.analyzeFontOnly(fontFile);
      const glyph = analysis.glyphs.find(g => g.unicode === unicode);
      
      if (!glyph) {
        throw new Error(`Glyph U+${unicode.toString(16).toUpperCase()} not found`);
      }
      
      // Get original path for comparison
      const originalPaths = this.getOriginalPaths();
      const originalPath = originalPaths.get(unicode);
      
      console.log(`🔍 Character Analysis: U+${unicode.toString(16).toUpperCase()}`);
      console.log(`  Name: ${glyph.name}`);
      console.log(`  Bounding Box: (${glyph.boundingBox.x1}, ${glyph.boundingBox.y1}) to (${glyph.boundingBox.x2}, ${glyph.boundingBox.y2})`);
      console.log(`  Y Range: ${glyph.yCoordinateRange.min} to ${glyph.yCoordinateRange.max}`);
      console.log(`  Path: ${glyph.pathData.substring(0, 100)}...`);
      
      if (originalPath) {
        console.log(`  Original SVG: ${originalPath.substring(0, 100)}...`);
        
        // Compare paths
        const comparison = FontAnalysisOrchestrator.comparePathsOnly(
          new Map([[unicode, originalPath]]),
          [glyph]
        );
        
        console.log(`  Similarity: ${comparison.averageSimilarity}%`);
        if (comparison.criticalIssues > 0) {
          console.warn(`  Critical Issues: ${comparison.criticalIssues}`);
        }
      }
      
      return glyph;
      
    } catch (error) {
      console.error('❌ Character analysis failed:', error);
      throw error;
    }
  }
  
  /**
   * Get the current font file from the app's state
   */
  private getCurrentFontFile(): File | null {
    // Try to access the app's state through various methods
    try {
      // Method 1: Check if there's a compiled font in the app state
      const appState = (window as any).__GLYPH_POTLUCK_APP_STATE__;
      if (appState?.compiledFont?.file) {
        return appState.compiledFont.file;
      }
      
      // Method 2: Look for font data in localStorage
      const fontData = localStorage.getItem('glyph-potluck-compiled-font');
      if (fontData) {
        const parsed = JSON.parse(fontData);
        if (parsed.file) {
          // Convert base64 back to File object
          return this.base64ToFile(parsed.file, 'generated-font.ttf');
        }
      }
      
      // Method 3: Check for any recent font files in the app
      const fontElements = document.querySelectorAll('a[href*=".ttf"], a[href*=".otf"]');
      if (fontElements.length > 0) {
        const href = (fontElements[0] as HTMLAnchorElement).href;
        if (href.startsWith('blob:')) {
          // This is a generated font, try to access it
          console.log('Found font download link:', href);
        }
      }
      
      return null;
      
    } catch (error) {
      console.warn('Could not access app state:', error);
      return null;
    }
  }
  
  /**
   * Get original SVG paths from the app's state
   */
  private getOriginalPaths(): Map<number, string> {
    const paths = new Map<number, string>();
    
    try {
      // Method 1: Check app state
      const appState = (window as any).__GLYPH_POTLUCK_APP_STATE__;
      if (appState?.vectorizedCharacters) {
        appState.vectorizedCharacters.forEach((char: any) => {
          if (char.unicode && char.vectorData) {
            paths.set(char.unicode, char.vectorData);
          }
        });
      }
      
      // Method 2: Check localStorage
      const charactersData = localStorage.getItem('glyph-potluck-characters');
      if (charactersData) {
        const parsed = JSON.parse(charactersData);
        parsed.forEach((char: any) => {
          if (char.unicode && char.vectorData) {
            paths.set(char.unicode, char.vectorData);
          }
        });
      }
      
      // Method 3: Try to access through DOM
      const characterElements = document.querySelectorAll('[data-unicode]');
      characterElements.forEach((el) => {
        const unicode = parseInt(el.getAttribute('data-unicode') || '0');
        const vectorData = el.getAttribute('data-vector-data');
        if (unicode && vectorData) {
          paths.set(unicode, vectorData);
        }
      });
      
    } catch (error) {
      console.warn('Could not access original paths:', error);
    }
    
    return paths;
  }
  
  /**
   * Convert base64 string to File object
   */
  private base64ToFile(base64: string, filename: string): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: 'font/ttf' });
  }
  
  /**
   * Display analysis results in a formatted way
   */
  private displayAnalysisResults(results: any) {
    console.log('\n📋 Font Analysis Results:');
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
    
    // Store results for further inspection
    (window as any).__LAST_FONT_ANALYSIS__ = results;
    console.log('\n💾 Results stored in: window.__LAST_FONT_ANALYSIS__');
  }
  
  /**
   * Get help and available commands
   */
  help(): void {
    console.log(`
🔧 Font Dev Tools - Available Commands
=====================================

window.FontDevTools.analyzeCurrentFont()
  - Analyzes the currently generated font
  - Compares with original vectorized glyphs
  - Provides detailed quality report

window.FontDevTools.quickQualityCheck()
  - Quick quality assessment of current font
  - Returns true/false for quality threshold

window.FontDevTools.analyzeCharacter(unicode)
  - Analyzes a specific character (e.g., 65 for 'A')
  - Shows transformation details and comparison

window.FontDevTools.help()
  - Shows this help message

Examples:
  window.FontDevTools.analyzeCurrentFont()
  window.FontDevTools.analyzeCharacter(65)  // Analyze 'A'
  window.FontDevTools.quickQualityCheck()

Note: Generate a font first, then use these tools to analyze it.
    `);
  }
}

// Initialize the bridge when this file is loaded
DevConsoleBridge.getInstance();
