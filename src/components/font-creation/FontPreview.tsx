import { useState } from 'react';
import { FontSettings } from '../../types';

export interface FontPreviewProps {
  fontSettings: FontSettings;
  characterData: Map<string, any>;
  compiledFont?: ArrayBuffer | null;
  isGenerating: boolean;
}

export function FontPreview({
  fontSettings,
  characterData,
  compiledFont,
  isGenerating
}: FontPreviewProps) {
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [fontSize, setFontSize] = useState(24);
  const [previewMode, setPreviewMode] = useState<'sample' | 'grid' | 'custom'>('sample');

  // Get vectorized characters
  const vectorizedCharacters = Array.from(characterData.values())
    .filter(char => char.vectorData && char.status === 'complete');

  const sampleTexts = [
    'The quick brown fox jumps over the lazy dog',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'Hello World! This is a test of your custom font.',
    'Typography is the art and technique of arranging type.'
  ];

  const renderCharacterGrid = () => {
    if (vectorizedCharacters.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          No vectorized characters available for preview
        </div>
      );
    }

    return (
      <div className="grid grid-cols-8 gap-2">
        {vectorizedCharacters.map((charData) => (
          <div
            key={charData.unicode}
            className="flex flex-col items-center p-2 border border-gray-200 rounded bg-gray-50"
          >
            <div className="text-xs text-gray-600 mb-1">
              {charData.unicode}
            </div>
            <div className="w-8 h-8 flex items-center justify-center">
              {charData.vectorData ? (
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                >
                  <path
                    d={charData.vectorData}
                    fill="currentColor"
                    className="text-gray-900"
                    stroke="none"
                  />
                </svg>
              ) : (
                <span className="text-gray-400">{charData.character}</span>
              )}
            </div>
            <div className="text-xs text-gray-700 font-mono">
              {charData.character}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomPreview = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview Text
        </label>
        <textarea
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter text to preview..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          step="2"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[120px] flex items-center">
        {compiledFont ? (
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: `"${fontSettings.metadata.familyName}", sans-serif`,
              fontWeight: fontSettings.metadata.weight,
              fontStyle: fontSettings.metadata.style === 'Italic' || fontSettings.metadata.style === 'Bold Italic' ? 'italic' : 'normal'
            }}
            className="text-gray-900 leading-relaxed"
          >
            {previewText}
          </div>
        ) : (
          <div className="text-gray-500 text-center w-full">
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                <span>Generating font preview...</span>
              </div>
            ) : (
              'Font preview will appear here after generation'
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSampleTexts = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {sampleTexts.map((text, index) => (
          <button
            key={index}
            onClick={() => setPreviewText(text)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              previewText === text
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {text.length > 20 ? text.substring(0, 20) + '...' : text}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[120px] flex items-center">
        {compiledFont ? (
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: `"${fontSettings.metadata.familyName}", sans-serif`,
              fontWeight: fontSettings.metadata.weight,
              fontStyle: fontSettings.metadata.style === 'Italic' || fontSettings.metadata.style === 'Bold Italic' ? 'italic' : 'normal'
            }}
            className="text-gray-900 leading-relaxed"
          >
            {previewText}
          </div>
        ) : (
          <div className="text-gray-500 text-center w-full">
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                <span>Generating font preview...</span>
              </div>
            ) : (
              'Font preview will appear here after generation'
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Font Preview
      </h3>

      {/* Preview Mode Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'sample', label: 'Sample Text' },
            { id: 'grid', label: 'Character Grid' },
            { id: 'custom', label: 'Custom Text' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPreviewMode(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                previewMode === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.id === 'grid' ? `${tab.label} (${vectorizedCharacters.length})` : tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Preview Content */}
      <div className="space-y-6">
        {previewMode === 'sample' && renderSampleTexts()}
        {previewMode === 'grid' && renderCharacterGrid()}
        {previewMode === 'custom' && renderCustomPreview()}
      </div>

      {/* Font Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Font Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Family:</span>
            <span className="ml-2 font-medium">{fontSettings.metadata.familyName}</span>
          </div>
          <div>
            <span className="text-gray-500">Style:</span>
            <span className="ml-2 font-medium">{fontSettings.metadata.style}</span>
          </div>
          <div>
            <span className="text-gray-500">Weight:</span>
            <span className="ml-2 font-medium">{fontSettings.metadata.weight}</span>
          </div>
          <div>
            <span className="text-gray-500">Characters:</span>
            <span className="ml-2 font-medium">{vectorizedCharacters.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
