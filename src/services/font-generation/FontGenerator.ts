import * as opentype from 'opentype.js';
import { GlyphConverter } from './GlyphConverter';
import { FontMetricsCalculator, FontMetrics } from './FontMetricsCalculator';
import { CharacterData } from '../../services/storage/CharacterDataStorage';
import { FontSettings, CompiledFont } from '../../types';

export interface FontProject {
  characters: Map<string, CharacterData>;
  fontSettings: FontSettings;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    license?: string;
    version?: string;
  };
}

export interface FontGenerationProgress {
  stage: 'preparing' | 'converting' | 'calculating' | 'building' | 'compiling' | 'complete';
  progress: number; // 0-100
  message: string;
  currentGlyph?: string;
  totalGlyphs?: number;
}

export interface FontGenerationResult {
  success: boolean;
  font?: CompiledFont;
  error?: string;
  warnings?: string[];
  metrics?: FontMetrics;
}

export class FontGenerator {
  private progressCallback?: (progress: FontGenerationProgress) => void;

  /**
   * Sets a progress callback for monitoring font generation
   */
  setProgressCallback(callback: (progress: FontGenerationProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Generates a complete font from character data
   */
  async generateFont(project: FontProject): Promise<FontGenerationResult> {
    try {
      this.updateProgress('preparing', 0, 'Preparing font generation...');

      // Validate project
      const validation = this.validateProject(project);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Project validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Convert SVG paths to OpenType glyphs
      this.updateProgress('converting', 20, 'Converting SVG paths to glyphs...');
      const glyphs = await this.convertCharactersToGlyphs(project.characters);

      if (glyphs.length === 0) {
        return {
          success: false,
          error: 'No valid glyphs could be created from the character data'
        };
      }

      // Calculate font metrics
      this.updateProgress('calculating', 40, 'Calculating font metrics...');
      const metrics = FontMetricsCalculator.calculateFontMetrics(glyphs);

      console.log('🔍 Calculated font metrics:', metrics);

      // Validate metrics
      const metricsValidation = FontMetricsCalculator.validateFontMetrics(metrics);
      if (metricsValidation.warnings.length > 0) {
        console.warn('⚠️ Font metrics validation warnings:', metricsValidation.warnings);
      }

      // Build OpenType font
      this.updateProgress('building', 60, 'Building OpenType font...');
      const font = await this.buildOpenTypeFont(glyphs, metrics, project.fontSettings);

      // Compile font formats
      this.updateProgress('compiling', 80, 'Compiling font formats...');
      const compiledFont = await this.compileFontFormats(font, project.metadata);

      this.updateProgress('complete', 100, 'Font generation complete!');

      return {
        success: true,
        font: compiledFont,
        metrics: metrics,
        warnings: metricsValidation.warnings
      };

    } catch (error) {
      console.error('❌ Font generation failed:', error);
      return {
        success: false,
        error: `Font generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validates the font project before generation
   */
  private validateProject(project: FontProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check minimum character count
    if (project.characters.size < 1) {
      errors.push('At least one character is required');
    }

    // Check font settings
    if (!project.fontSettings.metadata.familyName) {
      errors.push('Font family name is required');
    }

    // Validate character data
    for (const [unicode, charData] of project.characters) {
      if (!charData.vectorData) {
        errors.push(`Character ${unicode} has no vector data`);
      } else {
        // Validate SVG path
        const pathValidation = GlyphConverter.validateSVGPath(charData.vectorData);
        if (!pathValidation.isValid) {
          errors.push(`Character ${unicode} has invalid SVG path: ${pathValidation.errors.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converts character data to OpenType glyphs
   */
  private async convertCharactersToGlyphs(characters: Map<string, CharacterData>): Promise<opentype.Glyph[]> {
    const glyphs: opentype.Glyph[] = [];
    const totalCharacters = characters.size;
    let currentIndex = 0;

    for (const [unicode, charData] of characters) {
      if (!charData.vectorData) {
        console.warn(`⚠️ Skipping character ${unicode} - no vector data`);
        continue;
      }

      try {
        // Convert Unicode string to number
        const unicodeNumber = parseInt(unicode.replace('U+', ''), 16);

        // Convert SVG to OpenType glyph
        const glyph = GlyphConverter.svgPathToOpenTypeGlyph(charData.vectorData, unicodeNumber);
        glyphs.push(glyph);

        // Update progress
        currentIndex++;
        const progress = 20 + (currentIndex / totalCharacters) * 20; // 20-40%
        this.updateProgress('converting', progress, `Converting character ${unicode}...`, unicode, totalCharacters);

      } catch (error) {
        console.error(`❌ Failed to convert character ${unicode}:`, error);
        // Continue with other characters
      }
    }

    return glyphs;
  }

  /**
   * Builds an OpenType font from glyphs and metrics
   */
  private async buildOpenTypeFont(
    glyphs: opentype.Glyph[],
    metrics: FontMetrics,
    settings: FontSettings
  ): Promise<opentype.Font> {

    // Add required glyphs (space, null, etc.)
    const requiredGlyphs = this.createRequiredGlyphs(metrics);
    const allGlyphs = [...requiredGlyphs, ...glyphs];

    // Ensure descender is negative (OpenType.js requirement)
    const descender = Math.abs(metrics.descender) > 0 ? -Math.abs(metrics.descender) : -200;

    console.log('🔍 Font creation metrics:', {
      unitsPerEm: metrics.unitsPerEm,
      ascender: metrics.ascender,
      descender: descender,
      originalDescender: metrics.descender
    });

    // Create font instance with hardcoded defaults
    const font = new opentype.Font({
      familyName: settings.metadata.familyName,
      styleName: 'Regular', // Hardcoded default
      unitsPerEm: metrics.unitsPerEm,
      ascender: metrics.ascender,
      descender: descender,
      glyphs: allGlyphs
    });

    // Add font metadata
    font.names.fontFamily = { en: settings.metadata.familyName };
    font.names.fontSubfamily = { en: 'Regular' }; // Hardcoded default
    font.names.manufacturer = { en: settings.metadata.author || 'Glyph Potluck' };
    font.names.description = { en: settings.metadata.description || '' };
    font.names.license = { en: settings.metadata.license || 'MIT' };
    font.names.version = { en: settings.metadata.version || '1.0' };

    // Note: OpenType.js doesn't support setting underlinePosition/underlineThickness directly
    // These are calculated automatically from the font metrics

    return font;
  }

  /**
   * Creates required glyphs that every font needs
   */
  private createRequiredGlyphs(_metrics: FontMetrics): opentype.Glyph[] {
    const glyphs: opentype.Glyph[] = [];

    // Space character (U+0020)
    const spaceGlyph = new opentype.Glyph({
      name: 'space',
      unicode: 0x0020,
      advanceWidth: 500, // Standard space width
      path: new opentype.Path() // Empty path
    });
    glyphs.push(spaceGlyph);

    // Null character (U+0000) - required by OpenType
    const nullGlyph = new opentype.Glyph({
      name: '.notdef',
      unicode: 0x0000,
      advanceWidth: 600,
      path: new opentype.Path() // Empty path
    });
    glyphs.push(nullGlyph);

    return glyphs;
  }

  /**
   * Compiles the font into multiple formats
   */
  private async compileFontFormats(font: opentype.Font, _metadata: any): Promise<CompiledFont> {
    // Generate TTF format
    const ttfBuffer = font.toArrayBuffer();

    // Calculate checksum
    const checksum = await this.calculateChecksum(ttfBuffer);

    return {
      fontData: ttfBuffer,
      format: 'ttf',
      size: ttfBuffer.byteLength,
      checksum: checksum,
      glyphCount: font.glyphs.length,
      generatedAt: new Date()
    };
  }

  /**
   * Calculates SHA-256 checksum of font data
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('⚠️ Could not calculate checksum:', error);
      return 'unknown';
    }
  }

  /**
   * Updates progress and calls the progress callback
   */
  private updateProgress(
    stage: FontGenerationProgress['stage'],
    progress: number,
    message: string,
    currentGlyph?: string,
    totalGlyphs?: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress: Math.round(progress),
        message,
        currentGlyph,
        totalGlyphs
      });
    }
  }

  /**
   * Gets estimated generation time based on character count
   */
  static estimateGenerationTime(characterCount: number): number {
    // Rough estimate: 100ms per character + 500ms overhead
    return Math.max(1000, characterCount * 100 + 500);
  }

  /**
   * Validates if a font can be generated from the given data
   */
  static canGenerateFont(characters: Map<string, CharacterData>): { canGenerate: boolean; issues: string[] } {
    const issues: string[] = [];

    if (characters.size === 0) {
      issues.push('No characters provided');
      return { canGenerate: false, issues };
    }

    let validCharacters = 0;
    for (const [unicode, charData] of characters) {
      if (charData.vectorData) {
        const validation = GlyphConverter.validateSVGPath(charData.vectorData);
        if (validation.isValid) {
          validCharacters++;
        } else {
          issues.push(`Character ${unicode}: ${validation.errors.join(', ')}`);
        }
      } else {
        issues.push(`Character ${unicode}: No vector data`);
      }
    }

    if (validCharacters === 0) {
      issues.push('No valid characters found');
    }

    return {
      canGenerate: validCharacters > 0,
      issues
    };
  }
}
