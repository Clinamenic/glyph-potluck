import { CompiledFont } from '../../types';

export interface FontExportOptions {
  format: 'ttf' | 'otf' | 'woff' | 'woff2';
  filename?: string;
  includeMetadata?: boolean;
}

export interface FontExportResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  filename?: string;
}

export class FontExportService {
  /**
   * Exports a compiled font to the specified format and triggers download
   */
  static async exportFont(
    compiledFont: CompiledFont, 
    options: FontExportOptions
  ): Promise<FontExportResult> {
    try {
      // Validate format compatibility
      if (options.format !== compiledFont.format) {
        console.warn(`⚠️ Requested format ${options.format} doesn't match compiled format ${compiledFont.format}`);
      }

      // Generate filename
      const filename = this.generateFilename(options.filename || 'custom-font', options.format);

      // Create download
      const downloadUrl = await this.createFontDownload(compiledFont.fontData, filename);

      return {
        success: true,
        downloadUrl,
        filename
      };

    } catch (error) {
      console.error('❌ Font export failed:', error);
      return {
        success: false,
        error: `Font export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Creates a downloadable font file
   */
  private static async createFontDownload(
    fontData: ArrayBuffer, 
    filename: string
  ): Promise<string> {
    try {
      // Create blob from font data
      const blob = new Blob([fontData], { 
        type: this.getMimeType(filename) 
      });

      // Create object URL
      const url = URL.createObjectURL(blob);

      // Trigger download
      this.triggerDownload(url, filename);

      // Return URL for potential cleanup
      return url;

    } catch (error) {
      throw new Error(`Failed to create font download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Triggers the browser download
   */
  private static triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generates a filename for the font
   */
  private static generateFilename(baseName: string, format: string): string {
    // Clean base name (remove special characters)
    const cleanName = baseName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    
    // Convert to kebab-case
    const kebabName = cleanName.replace(/\s+/g, '-').toLowerCase();
    
    // Add format extension
    return `${kebabName}.${format}`;
  }

  /**
   * Gets the MIME type for the font format
   */
  private static getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'ttf':
        return 'font/ttf';
      case 'otf':
        return 'font/otf';
      case 'woff':
        return 'font/woff';
      case 'woff2':
        return 'font/woff2';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Cleans up object URLs to prevent memory leaks
   */
  static cleanupDownloadUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('⚠️ Could not cleanup download URL:', error);
    }
  }

  /**
   * Gets file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validates font file integrity
   */
  static async validateFontFile(fontData: ArrayBuffer): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check minimum file size
      if (fontData.byteLength < 1024) {
        issues.push('Font file is too small (less than 1KB)');
      }

      // Check for reasonable maximum size
      if (fontData.byteLength > 10 * 1024 * 1024) {
        issues.push('Font file is unusually large (more than 10MB)');
      }

      // Check file header (basic TTF/OTF validation)
      const header = new Uint8Array(fontData, 0, 4);
      const headerString = String.fromCharCode(...header);
      
      if (!['OTTO', 'ttcf', 'true'].includes(headerString)) {
        issues.push('Font file has invalid header signature');
      }

      // Additional validation could be added here
      // - Check table structure
      // - Validate glyph data
      // - Check font metrics

    } catch (error) {
      issues.push(`Font validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Exports font metadata as JSON
   */
  static exportFontMetadata(
    compiledFont: CompiledFont, 
    fontSettings: any, 
    characterCount: number
  ): string {
    const metadata = {
      font: {
        format: compiledFont.format,
        size: compiledFont.size,
        sizeFormatted: this.formatFileSize(compiledFont.size),
        glyphCount: compiledFont.glyphCount,
        checksum: compiledFont.checksum,
        generatedAt: compiledFont.generatedAt.toISOString()
      },
      settings: fontSettings,
      statistics: {
        characterCount,
        estimatedGenerationTime: `${Math.round(compiledFont.glyphCount * 100)}ms`
      }
    };

    return JSON.stringify(metadata, null, 2);
  }

  /**
   * Creates a comprehensive font package (font + metadata)
   */
  static async createFontPackage(
    compiledFont: CompiledFont,
    fontSettings: any,
    characterCount: number,
    options: FontExportOptions
  ): Promise<FontExportResult> {
    try {
      // Export main font
      const fontResult = await this.exportFont(compiledFont, options);
      
      if (!fontResult.success) {
        return fontResult;
      }

      // Export metadata
      const metadata = this.exportFontMetadata(compiledFont, fontSettings, characterCount);
      const metadataBlob = new Blob([metadata], { type: 'application/json' });
      const metadataUrl = URL.createObjectURL(metadataBlob);

      // Trigger metadata download
      const metadataFilename = options.filename ? 
        `${options.filename.replace(/\.[^/.]+$/, '')}-metadata.json` : 
        'font-metadata.json';
      
      this.triggerDownload(metadataUrl, metadataFilename);

      // Cleanup metadata URL
      this.cleanupDownloadUrl(metadataUrl);

      return fontResult;

    } catch (error) {
      console.error('❌ Font package creation failed:', error);
      return {
        success: false,
        error: `Font package creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
