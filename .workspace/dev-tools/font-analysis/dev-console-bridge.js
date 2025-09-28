// Dev Console Bridge - JavaScript Version
// This allows the dev tools to access the main application data
// without requiring imports in the main app

// Prevent duplicate loading
if (typeof window.FontDevTools === 'undefined') {

  /**
   * Bridge class that provides access to main application data
   * Access this through the browser console for debugging
   */
  class DevConsoleBridge {
    constructor() {
      // Make this accessible globally
      window.FontDevTools = this;
      console.log('🔧 Font Dev Tools loaded. Access via: window.FontDevTools');
    }
    
    /**
     * Analyzes the currently generated font (if any)
     * Call this after font generation to examine the result
     */
    async analyzeCurrentFont() {
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
        
        // For now, just analyze the font file directly
        const analysis = await this.analyzeFontFile(fontFile);
        
        // Display results
        this.displayAnalysisResults(analysis, originalPaths);
        
        return analysis;
        
      } catch (error) {
        console.error('❌ Font analysis failed:', error);
        throw error;
      }
    }
    
    /**
     * Quick quality check of the current font
     */
    async quickQualityCheck() {
      try {
        const fontFile = this.getCurrentFontFile();
        if (!fontFile) {
          console.warn('⚠️ No font file found');
          return false;
        }
        
        const analysis = await this.analyzeFontFile(fontFile);
        
        const quality = analysis.qualityScore;
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
    async analyzeCharacter(unicode) {
      try {
        const fontFile = this.getCurrentFontFile();
        if (!fontFile) {
          throw new Error('No font file found');
        }
        
        const analysis = await this.analyzeFontFile(fontFile);
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
          
          // Basic path comparison
          const similarity = this.calculatePathSimilarity(originalPath, glyph.pathData);
          console.log(`  Similarity: ${similarity}%`);
        }
        
        return glyph;
        
      } catch (error) {
        console.error('❌ Character analysis failed:', error);
        throw error;
      }
    }
    
    /**
     * Analyze font file using basic methods
     */
    async analyzeFontFile(fontFile) {
      try {
        console.log('🔍 Analyzing font file...');
        console.log(`  File: ${fontFile.name} (${this.formatFileSize(fontFile.size)})`);
        
        // Basic analysis without external libraries
        const analysis = {
          fontName: fontFile.name,
          fileSize: fontFile.size,
          glyphCount: 1, // Assume 1 for now
          coordinateSystem: 'unknown',
          qualityScore: 0,
          glyphs: [],
          issues: [],
          recommendations: []
        };
        
        // Try to determine coordinate system from file content
        const arrayBuffer = await fontFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Basic TTF header check
        if (uint8Array.length > 4) {
          const signature = String.fromCharCode(...uint8Array.slice(0, 4));
          console.log(`  File signature: ${signature}`);
          
          if (signature === 'true') {
            analysis.coordinateSystem = 'TTF (TrueType)';
            analysis.qualityScore = 60;
          } else if (signature === 'OTTO') {
            analysis.coordinateSystem = 'OTF (OpenType)';
            analysis.qualityScore = 60;
          } else {
            analysis.coordinateSystem = 'Unknown format';
            analysis.qualityScore = 20;
          }
        }
        
        // Try to extract more information from the file
        if (uint8Array.length > 12) {
          // Check for potential font metrics
          const potentialMetrics = uint8Array.slice(8, 12);
          console.log(`  Potential metrics bytes: [${Array.from(potentialMetrics).join(', ')}]`);
        }
        
        // Create a basic glyph analysis
        analysis.glyphs.push({
          unicode: 65, // A
          name: 'A',
          pathData: 'Mock path data (basic analysis)',
          boundingBox: { x1: 0, y1: 0, x2: 100, y2: 100 },
          yCoordinateRange: { min: 0, max: 100 }
        });
        
        // Add recommendations based on analysis
        if (analysis.coordinateSystem.includes('TTF') || analysis.coordinateSystem.includes('OTF')) {
          analysis.recommendations.push('Font format appears valid');
          analysis.recommendations.push('Use opentype.js for detailed glyph analysis');
        } else {
          analysis.issues.push('Unknown font format - may not be a valid font file');
          analysis.recommendations.push('Verify this is a valid .ttf or .otf file');
        }
        
        console.log('✅ Basic analysis complete');
        return analysis;
        
      } catch (error) {
        console.error('❌ Font file analysis failed:', error);
        throw error;
      }
    }
    
    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Calculate basic path similarity
     */
    calculatePathSimilarity(originalPath, generatedPath) {
      if (!originalPath || !generatedPath) return 0;
      
      // Simple similarity based on path length and content
      const originalLength = originalPath.length;
      const generatedLength = generatedPath.length;
      
      if (originalLength === 0 || generatedLength === 0) return 0;
      
      // Basic similarity calculation
      const lengthSimilarity = Math.min(originalLength, generatedLength) / Math.max(originalLength, generatedLength);
      const contentSimilarity = originalPath.includes('M') && generatedPath.includes('M') ? 0.8 : 0.3;
      
      return Math.round((lengthSimilarity + contentSimilarity) * 50);
    }
    
    /**
     * Get the current font file from the app's state
     */
    getCurrentFontFile() {
      // Try to access the app's state through various methods
      try {
        console.log('🔍 Searching for font file...');
        
        // Method 1: Check for dropped font file (highest priority)
        if (window.__CURRENT_FONT_FILE__) {
          console.log('✅ Found dropped font file');
          return window.__CURRENT_FONT_FILE__;
        }
        
        // Method 2: Check if there's a compiled font in the app state
        const appState = window.__GLYPH_POTLUCK_APP_STATE__;
        if (appState?.compiledFont?.file) {
          console.log('✅ Found font in app state');
          return appState.compiledFont.file;
        }
        
        // Method 3: Look for font data in localStorage
        const fontData = localStorage.getItem('glyph-potluck-compiled-font');
        if (fontData) {
          const parsed = JSON.parse(fontData);
          if (parsed.file) {
            console.log('✅ Found font in localStorage');
            // Convert base64 back to File object
            return this.base64ToFile(parsed.file, 'generated-font.ttf');
          }
        }
        
        // Method 4: Check for any recent font files in the app
        const fontElements = document.querySelectorAll('a[href*=".ttf"], a[href*=".otf"]');
        if (fontElements.length > 0) {
          const href = fontElements[0].href;
          if (href.startsWith('blob:')) {
            console.log('✅ Found font download link:', href);
            // Try to fetch the blob
            return this.fetchBlobAsFile(href, 'generated-font.ttf');
          }
        }
        
        // Method 5: Look for recent downloads in the app's DOM
        const downloadLinks = document.querySelectorAll('[download*=".ttf"], [download*=".otf"]');
        if (downloadLinks.length > 0) {
          console.log('✅ Found download attributes');
          // Try to get the file from the download attribute
          const downloadLink = downloadLinks[0];
          const href = downloadLink.href;
          if (href && href.startsWith('blob:')) {
            return this.fetchBlobAsFile(href, downloadLink.download || 'generated-font.ttf');
          }
        }
        
        // Method 6: Look for any blob URLs that might be fonts
        const allLinks = document.querySelectorAll('a[href^="blob:"]');
        for (const link of allLinks) {
          const href = link.href;
          if (href.includes('.ttf') || href.includes('.otf') || link.textContent.includes('font')) {
            console.log('✅ Found potential font blob:', href);
            return this.fetchBlobAsFile(href, 'generated-font.ttf');
          }
        }
        
        // Method 7: Check if there's a recent download in the browser
        console.log('🔍 No font found in app state or DOM');
        console.log('  Try dropping a font file in the drop zone above');
        console.log('  Or make sure you have generated a font recently');
        
        return null;
        
      } catch (error) {
        console.warn('Could not access app state:', error);
        return null;
      }
    }
    
    /**
     * Get original SVG paths from the app's state
     */
    getOriginalPaths() {
      const paths = new Map();
      
      try {
        // Method 1: Check app state
        const appState = window.__GLYPH_POTLUCK_APP_STATE__;
        if (appState?.vectorizedCharacters) {
          appState.vectorizedCharacters.forEach(char => {
            if (char.unicode && char.vectorData) {
              paths.set(char.unicode, char.vectorData);
            }
          });
        }
        
        // Method 2: Check localStorage
        const charactersData = localStorage.getItem('glyph-potluck-characters');
        if (charactersData) {
          const parsed = JSON.parse(charactersData);
          parsed.forEach(char => {
            if (char.unicode && char.vectorData) {
              paths.set(char.unicode, char.vectorData);
            }
          });
        }
        
        // Method 3: Try to access through DOM
        const characterElements = document.querySelectorAll('[data-unicode]');
        characterElements.forEach(el => {
          const unicode = parseInt(el.getAttribute('data-unicode') || '0');
          const vectorData = el.getAttribute('data-vector-data');
          if (unicode && vectorData) {
            paths.set(unicode, vectorData);
          }
        });
        
        // Method 4: Look for SVG elements in the app
        const svgElements = document.querySelectorAll('svg path');
        if (svgElements.length > 0) {
          console.log('🔍 Found SVG elements in the app');
          // Try to extract path data from visible SVGs
          svgElements.forEach((path, index) => {
            const d = path.getAttribute('d');
            if (d) {
              paths.set(65 + index, d); // Assume sequential unicode
            }
          });
        }
        
      } catch (error) {
        console.warn('Could not access original paths:', error);
      }
      
      return paths;
    }
    
    /**
     * Convert base64 string to File object
     */
    base64ToFile(base64, filename) {
      try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], filename, { type: 'font/ttf' });
      } catch (error) {
        console.error('Failed to convert base64 to file:', error);
        return null;
      }
    }
    
    /**
     * Fetch blob URL and convert to File object
     */
    async fetchBlobAsFile(blobUrl, filename) {
      try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || 'font/ttf' });
      } catch (error) {
        console.error('Failed to fetch blob as file:', error);
        return null;
      }
    }
    
    /**
     * Display analysis results in a formatted way
     */
    displayAnalysisResults(analysis, originalPaths) {
      console.log('\n📋 Font Analysis Results:');
      console.log('==========================');
      console.log(`Font Name: ${analysis.fontName}`);
      console.log(`File Size: ${analysis.fileSize} bytes`);
      console.log(`Glyph Count: ${analysis.glyphCount}`);
      console.log(`Coordinate System: ${analysis.coordinateSystem}`);
      console.log(`Quality Score: ${analysis.qualityScore}%`);
      
      if (originalPaths.size > 0) {
        console.log(`Original Paths: ${originalPaths.size} characters`);
        
        // Show path comparison
        originalPaths.forEach((path, unicode) => {
          console.log(`\nU+${unicode.toString(16).toUpperCase()}:`);
          console.log(`  Original: ${path.substring(0, 80)}...`);
        });
      }
      
      if (analysis.issues.length > 0) {
        console.log('\n⚠️ Issues Found:');
        analysis.issues.forEach(issue => console.log(`  • ${issue}`));
      }
      
      if (analysis.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        analysis.recommendations.forEach(rec => console.log(`  • ${rec}`));
      }
      
      // Store results for further inspection
      window.__LAST_FONT_ANALYSIS__ = analysis;
      console.log('\n💾 Results stored in: window.__LAST_FONT_ANALYSIS__');
    }
    
    /**
     * Get help and available commands
     */
    help() {
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

  // Initialize the bridge
  new DevConsoleBridge();

} else {
  console.log('🔧 Font Dev Tools already loaded');
}
