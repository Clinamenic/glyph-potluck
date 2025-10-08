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
        <div className="preview-panel-content">
          No vectorized characters available for preview
        </div>
      );
    }

    return (
      <div className="character-grid">
        {vectorizedCharacters.map((charData) => (
          <div
            key={charData.unicode}
            className="character-tile"
          >
            <div className="unicode-label">
              {charData.unicode}
            </div>
            <div className="character-display">
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
            <div className="unicode-label">
              {charData.character}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomPreview = () => (
    <div className="preview-content-area">
      <div className="form-field">
        <label className="form-field-label">
          Preview Text
        </label>
        <textarea
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          rows={3}
          className="form-field-input"
          placeholder="Enter text to preview..."
        />
      </div>

      <div className="form-field">
        <label className="form-field-label">
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          step="2"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="weight-slider-container"
        />
      </div>

      <div className="preview-text-area">
        {compiledFont ? (
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: `"${fontSettings.metadata.familyName}", sans-serif`,
              fontWeight: 400, // Hardcoded default
              fontStyle: 'normal' // Hardcoded default
            }}
            className="text-gray-900 leading-relaxed"
          >
            {previewText}
          </div>
        ) : (
          <div className="preview-text-placeholder">
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner"></div>
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
    <div className="preview-content-area">
      <div className="preview-sample-buttons">
        {sampleTexts.map((text, index) => (
          <button
            key={index}
            onClick={() => setPreviewText(text)}
            className={`preview-sample-button ${previewText === text
              ? 'preview-sample-button--active'
              : 'preview-sample-button--inactive'
              }`}
          >
            {text.length > 20 ? text.substring(0, 20) + '...' : text}
          </button>
        ))}
      </div>

      <div className="preview-text-area">
        {compiledFont ? (
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: `"${fontSettings.metadata.familyName}", sans-serif`,
              fontWeight: 400, // Hardcoded default
              fontStyle: 'normal' // Hardcoded default
            }}
            className="text-gray-900 leading-relaxed"
          >
            {previewText}
          </div>
        ) : (
          <div className="preview-text-placeholder">
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner"></div>
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
    <div className="card">
      <div className="card-header">
        <h3 className="card-heading">
          Font Preview
        </h3>
      </div>

      {/* Preview Mode Tabs */}
      <div className="preview-tabs">
        <nav className="preview-tab-nav">
          {[
            { id: 'sample', label: 'Sample Text' },
            { id: 'grid', label: 'Character Grid' },
            { id: 'custom', label: 'Custom Text' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPreviewMode(tab.id as any)}
              className={`preview-tab-button ${previewMode === tab.id
                ? 'preview-tab-button--active'
                : 'preview-tab-button--inactive'
                }`}
            >
              {tab.id === 'grid' ? `${tab.label} (${vectorizedCharacters.length})` : tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Preview Content */}
      <div className="preview-content-area">
        {previewMode === 'sample' && renderSampleTexts()}
        {previewMode === 'grid' && renderCharacterGrid()}
        {previewMode === 'custom' && renderCustomPreview()}
      </div>

      {/* Font Information */}
      <div className="preview-info-section">
        <h4 className="preview-info-title">Font Information</h4>
        <div className="preview-info-grid">
          <div className="preview-info-item">
            <span className="preview-info-label">Family:</span>
            <span className="preview-info-value">{fontSettings.metadata.familyName}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Style:</span>
            <span className="preview-info-value">{fontSettings.metadata.style}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Weight:</span>
            <span className="preview-info-value">{fontSettings.metadata.weight}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Characters:</span>
            <span className="preview-info-value">{vectorizedCharacters.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
