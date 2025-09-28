import * as opentype from 'opentype.js';

export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  xHeight: number;
  capHeight: number;
  baseline: number;
  lineGap: number;
  underlinePosition: number;
  underlineThickness: number;
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

export class FontMetricsCalculator {
  /**
   * Calculates comprehensive font metrics from a collection of glyphs
   */
  static calculateFontMetrics(glyphs: opentype.Glyph[]): FontMetrics {
    if (glyphs.length === 0) {
      throw new Error('Cannot calculate metrics for empty glyph collection');
    }

    try {
      // Calculate basic metrics
      const ascender = this.calculateAscender(glyphs);
      const descender = this.calculateDescender(glyphs);
      const xHeight = this.calculateXHeight(glyphs);
      const capHeight = this.calculateCapHeight(glyphs);
      
      // Calculate line gap (space between lines)
      const lineGap = Math.round((ascender - descender) * 0.2); // 20% of total height
      
      // Calculate underline metrics
      const underlinePosition = Math.round(descender * 0.1); // 10% below baseline
      const underlineThickness = Math.round((ascender - descender) * 0.05); // 5% of total height

          const result = {
      unitsPerEm: 1000, // Standard OpenType units per em
      ascender: Math.round(ascender),
      descender: Math.round(descender),
      xHeight: Math.round(xHeight),
      capHeight: Math.round(capHeight),
      baseline: 0, // Baseline is always at 0
      lineGap: Math.round(lineGap),
      underlinePosition: Math.round(underlinePosition),
      underlineThickness: Math.round(underlineThickness)
    };
    
    console.log('🔍 FontMetricsCalculator result:', result);
    
    return result;
    } catch (error) {
      console.error('❌ Failed to calculate font metrics:', error);
      throw new Error(`Font metrics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculates the ascender (highest point) of the font
   */
  private static calculateAscender(glyphs: opentype.Glyph[]): number {
    let maxAscender = -Infinity;
    
    glyphs.forEach(glyph => {
      try {
        const bounds = glyph.getBoundingBox();
        if (bounds && bounds.y2 > maxAscender) {
          maxAscender = bounds.y2;
        }
      } catch (error) {
        console.warn(`⚠️ Could not get bounds for glyph ${glyph.name}:`, error);
      }
    });

    // If no valid bounds found, use default
    if (maxAscender === -Infinity) {
      maxAscender = 800; // Default ascender for 1000 units per em
    }

    return maxAscender;
  }

  /**
   * Calculates the descender (lowest point) of the font
   */
  private static calculateDescender(glyphs: opentype.Glyph[]): number {
    let minDescender = Infinity;
    
    glyphs.forEach(glyph => {
      try {
        const bounds = glyph.getBoundingBox();
        if (bounds && bounds.y1 < minDescender) {
          minDescender = bounds.y1;
        }
      } catch (error) {
        console.warn(`⚠️ Could not get bounds for glyph ${glyph.name}:`, error);
      }
    });

    // If no valid bounds found, use default
    if (minDescender === Infinity) {
      minDescender = -200; // Default descender for 1000 units per em
    }

    return minDescender;
  }

  /**
   * Calculates the x-height (height of lowercase 'x')
   */
  private static calculateXHeight(glyphs: opentype.Glyph[]): number {
    // Look for lowercase 'x' first
    const xGlyph = glyphs.find(g => g.unicode === 0x78); // 'x' character
    
    if (xGlyph) {
      try {
        const bounds = xGlyph.getBoundingBox();
        if (bounds) {
          return bounds.y2; // Height of 'x' character
        }
      } catch (error) {
        console.warn(`⚠️ Could not get bounds for 'x' glyph:`, error);
      }
    }

    // Fallback: calculate from lowercase letters
    const lowercaseGlyphs = glyphs.filter(g => {
      if (!g.unicode) return false;
      const char = String.fromCharCode(g.unicode);
      return char === char.toLowerCase() && char !== char.toUpperCase();
    });

    if (lowercaseGlyphs.length > 0) {
      let totalHeight = 0;
      let validCount = 0;
      
              lowercaseGlyphs.forEach(glyph => {
          try {
            const bounds = glyph.getBoundingBox();
            if (bounds) {
              totalHeight += bounds.y2;
              validCount++;
            }
          } catch (error) {
            // Skip invalid glyphs
          }
        });

      if (validCount > 0) {
        return Math.round(totalHeight / validCount);
      }
    }

    // Default x-height: 50% of ascender
    return Math.round(this.calculateAscender(glyphs) * 0.5);
  }

  /**
   * Calculates the cap height (height of capital letters)
   */
  private static calculateCapHeight(glyphs: opentype.Glyph[]): number {
    // Look for capital 'H' first (good reference for cap height)
    const hGlyph = glyphs.find(g => g.unicode === 0x48); // 'H' character
    
    if (hGlyph) {
      try {
        const bounds = hGlyph.getBoundingBox();
        if (bounds) {
          return bounds.y2; // Height of 'H' character
        }
      } catch (error) {
        console.warn(`⚠️ Could not get bounds for 'H' glyph:`, error);
      }
    }

    // Fallback: calculate from capital letters
    const capitalGlyphs = glyphs.filter(g => {
      if (!g.unicode) return false;
      const char = String.fromCharCode(g.unicode);
      return char === char.toUpperCase() && char !== char.toLowerCase();
    });

    if (capitalGlyphs.length > 0) {
      let totalHeight = 0;
      let validCount = 0;
      
              capitalGlyphs.forEach(glyph => {
          try {
            const bounds = glyph.getBoundingBox();
            if (bounds) {
              totalHeight += bounds.y2;
              validCount++;
            }
          } catch (error) {
            // Skip invalid glyphs
          }
        });

      if (validCount > 0) {
        return Math.round(totalHeight / validCount);
      }
    }

    // Default cap height: 80% of ascender
    return Math.round(this.calculateAscender(glyphs) * 0.8);
  }

  /**
   * Calculates optimal advance widths for glyphs
   */
  static calculateOptimalAdvanceWidths(glyphs: opentype.Glyph[]): Map<string, number> {
    const advanceWidths = new Map<string, number>();
    
    glyphs.forEach(glyph => {
      try {
        const bounds = glyph.getBoundingBox();
        if (bounds) {
          // Calculate optimal advance width based on bounds
          const width = bounds.x2 - bounds.x1;
          const leftSideBearing = Math.max(0, -bounds.x1);
          const rightSideBearing = Math.max(0, 50); // Default right margin
          
          const advanceWidth = Math.round(width + leftSideBearing + rightSideBearing);
          advanceWidths.set(glyph.name || 'unknown', advanceWidth);
        }
      } catch (error) {
        console.warn(`⚠️ Could not calculate advance width for glyph ${glyph.name}:`, error);
        // Use default advance width
        advanceWidths.set(glyph.name || 'unknown', 600);
      }
    });

    return advanceWidths;
  }

  /**
   * Validates font metrics for consistency
   */
  static validateFontMetrics(metrics: FontMetrics): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check for reasonable values
    if (metrics.ascender <= 0) {
      warnings.push('Ascender must be positive');
    }

    if (metrics.descender >= 0) {
      warnings.push('Descender should be negative');
    }

    if (metrics.xHeight <= 0 || metrics.xHeight > metrics.ascender) {
      warnings.push('X-height must be positive and less than ascender');
    }

    if (metrics.capHeight <= 0 || metrics.capHeight > metrics.ascender) {
      warnings.push('Cap height must be positive and less than ascender');
    }

    if (metrics.xHeight > metrics.capHeight) {
      warnings.push('X-height should be less than cap height');
    }

    // Check for reasonable proportions
    const totalHeight = metrics.ascender - metrics.descender;
    if (totalHeight > metrics.unitsPerEm) {
      warnings.push('Total height exceeds units per em');
    }

    if (metrics.lineGap < 0) {
      warnings.push('Line gap should be non-negative');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Normalizes font metrics to standard OpenType values
   */
  static normalizeFontMetrics(metrics: FontMetrics): FontMetrics {
    return {
      ...metrics,
      unitsPerEm: 1000, // Standard OpenType value
      baseline: 0, // Baseline is always at 0
      ascender: Math.round(metrics.ascender),
      descender: Math.round(metrics.descender),
      xHeight: Math.round(metrics.xHeight),
      capHeight: Math.round(metrics.capHeight),
      lineGap: Math.round(metrics.lineGap),
      underlinePosition: Math.round(metrics.underlinePosition),
      underlineThickness: Math.round(metrics.underlineThickness)
    };
  }
}
