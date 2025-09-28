import { useState } from 'react';
import { CompiledFont } from '../../types';
import { FontExportService, FontExportOptions } from '../../services/font-generation';

export interface FontExportPanelProps {
  compiledFont: CompiledFont | null;
  fontSettings: any;
  characterCount: number;
  onExport: (options: FontExportOptions) => Promise<void>;
  isExporting: boolean;
}

export function FontExportPanel({
  compiledFont,
  fontSettings,
  onExport,
  isExporting
}: FontExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'ttf' | 'otf'>('ttf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');

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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Font Export
        </h3>
        <div className="text-center text-gray-500 py-8">
          Generate a font first to enable export options
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Font Export
      </h3>

      {/* Font Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Generated Font Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Format:</span>
            <span className="ml-2 font-medium">{compiledFont.format.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-gray-500">File Size:</span>
            <span className="ml-2 font-medium">{getFileSize()}</span>
          </div>
          <div>
            <span className="text-gray-500">Glyphs:</span>
            <span className="ml-2 font-medium">{compiledFont.glyphCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Generated:</span>
            <span className="ml-2 font-medium">
              {compiledFont.generatedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <p className="text-xs text-gray-500 mt-1">
            TTF offers maximum compatibility, OTF provides advanced typography features
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder={fontSettings.metadata.familyName || 'custom-font'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use font family name
          </p>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Include metadata file (JSON)</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Downloads additional JSON file with font information and settings
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div className="space-y-4">
        <button
          onClick={handleExport}
          disabled={isExporting || exportStatus === 'exporting'}
          className={`w-full px-4 py-3 text-lg font-medium rounded-lg transition-colors ${
            !isExporting && exportStatus !== 'exporting'
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {exportStatus === 'exporting' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </div>
          ) : (
            `Download ${exportFormat.toUpperCase()} Font`
          )}
        </button>

        {/* Status Messages */}
        {exportStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="text-green-600 mr-2">✅</div>
              <span className="text-green-800 text-sm">{exportMessage}</span>
            </div>
          </div>
        )}

        {exportStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">❌</div>
              <span className="text-red-800 text-sm">{exportMessage}</span>
            </div>
          </div>
        )}

        {exportStatus === 'exporting' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-800 text-sm">{exportMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Export Information</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Font will be downloaded in {exportFormat.toUpperCase()} format</p>
          <p>• File size: approximately {getFileSize()}</p>
          <p>• Contains {compiledFont.glyphCount} glyphs</p>
          <p>• Generated at {compiledFont.generatedAt.toLocaleString()}</p>
          {includeMetadata && (
            <p>• Metadata file will be included with font details</p>
          )}
        </div>
      </div>
    </div>
  );
}
