import { useState, useEffect } from 'react';
import { CompiledFont } from '../../types';
import { FontExportService, FontExportOptions } from '../../services/font-generation';
import { InfoButton } from '../ui/InfoButton';
import { UseModalReturn } from '../../hooks/useModal';

export interface FontExportPanelProps {
  compiledFont: CompiledFont | null;
  fontSettings: any;
  characterCount: number;
  onExport: (options: FontExportOptions) => Promise<void>;
  isExporting: boolean;
  exportInfoModal: UseModalReturn;
  onExportStateChange?: (state: {
    exportFormat: 'ttf' | 'otf';
    includeMetadata: boolean;
  }) => void;
}

export function FontExportPanel({
  compiledFont,
  fontSettings,
  onExport,
  isExporting,
  exportInfoModal,
  onExportStateChange
}: FontExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'ttf' | 'otf'>('ttf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');

  // Notify parent of export state changes
  useEffect(() => {
    if (onExportStateChange) {
      onExportStateChange({
        exportFormat,
        includeMetadata
      });
    }
  }, [exportFormat, includeMetadata, onExportStateChange]);

  const handleExport = async () => {
    if (!compiledFont) return;

    try {
      setExportStatus('exporting');
      setExportMessage('Preparing font for download...');

      const options: FontExportOptions = {
        format: exportFormat,
        filename: customFilename || fontSettings.metadata.familyName,
        includeMetadata
      };

      await onExport(options);

      setExportStatus('success');
      setExportMessage('Font exported successfully!');

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);

    } catch (error) {
      setExportStatus('error');
      setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getFileSize = () => {
    if (!compiledFont) return '0 KB';
    return FontExportService.formatFileSize(compiledFont.size);
  };



  if (!compiledFont) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-heading">
            Font Export
          </h3>
          <InfoButton
            onClick={exportInfoModal.open}
            tooltip="Export Information"
            className="info-button--inline"
          />
        </div>
        <div className="export-panel-content">
          Generate a font first to enable export options
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-heading">
          Font Export
        </h3>
        <InfoButton
          onClick={exportInfoModal.open}
          tooltip="Export Information"
          className="info-button--inline"
        />
      </div>

      {/* Font Information */}
      <div className="preview-panel mb-6">
        <h4 className="preview-info-title">Generated Font Details</h4>
        <div className="preview-info-grid">
          <div className="preview-info-item">
            <span className="preview-info-label">Format:</span>
            <span className="preview-info-value">{compiledFont.format.toUpperCase()}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">File Size:</span>
            <span className="preview-info-value">{getFileSize()}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Glyphs:</span>
            <span className="preview-info-value">{compiledFont.glyphCount}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Generated:</span>
            <span className="preview-info-value">
              {compiledFont.generatedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="tab-section mb-6">
        <div className="form-field">
          <label className="form-field-label">
            Export Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="ttf"
                checked={exportFormat === 'ttf'}
                onChange={(e) => setExportFormat(e.target.value as 'ttf' | 'otf')}
                className="mr-2"
              />
              <span className="text-sm">TTF (TrueType)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="otf"
                checked={exportFormat === 'otf'}
                onChange={(e) => setExportFormat(e.target.value as 'ttf' | 'otf')}
                className="mr-2"
              />
              <span className="text-sm">OTF (OpenType)</span>
            </label>
          </div>
          <p className="form-field-help">
            TTF offers maximum compatibility, OTF provides advanced typography features
          </p>
        </div>

        <div className="form-field">
          <label className="form-field-label">
            Filename
          </label>
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder={fontSettings.metadata.familyName || 'custom-font'}
            className="form-field-input"
          />
          <p className="form-field-help">
            Leave empty to use font family name
          </p>
        </div>

        <div className="form-field">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Include metadata file (JSON)</span>
          </label>
          <p className="form-field-help">
            Downloads additional JSON file with font information and settings
          </p>
        </div>
      </div>

      {/* Card Footer with Export Actions and Status */}
      <div className="card-footer card-footer--center">
        <div className="card-footer-actions">
          <button
            onClick={handleExport}
            disabled={isExporting || exportStatus === 'exporting'}
            className={`btn btn-primary btn-lg ${(isExporting || exportStatus === 'exporting') ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {exportStatus === 'exporting' ? (
              <div className="flex items-center justify-center gap-2">
                <div className="loading-spinner"></div>
                <span>Exporting...</span>
              </div>
            ) : (
              `Download ${exportFormat.toUpperCase()} Font`
            )}
          </button>
        </div>

        {/* Status Messages in Footer */}
        {(exportStatus === 'success' || exportStatus === 'error' || exportStatus === 'exporting') && (
          <div className="card-footer-meta">
            {exportStatus === 'success' && (
              <span className="text-green-600">✅ {exportMessage}</span>
            )}
            {exportStatus === 'error' && (
              <span className="text-red-600">❌ {exportMessage}</span>
            )}
            {exportStatus === 'exporting' && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600">{exportMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
