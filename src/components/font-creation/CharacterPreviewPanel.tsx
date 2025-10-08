import React, { useCallback } from 'react';
import { CharacterData } from '../../services/storage/CharacterDataStorage';

interface CharacterPreviewPanelProps {
  selectedCharacter: string | undefined;
  characterData: CharacterData | undefined;
  onRevectorize: (unicode: string) => void;
  isProcessing: boolean;
  onOpenPathEditor: (unicode: string) => void;
}

export const CharacterPreviewPanel: React.FC<CharacterPreviewPanelProps> = ({
  selectedCharacter,
  characterData,
  onRevectorize,
  isProcessing,
  onOpenPathEditor
}) => {
  // Handle path editor modal open
  const handleOpenPathEditor = useCallback(() => {
    if (selectedCharacter) {
      onOpenPathEditor(selectedCharacter);
    }
  }, [selectedCharacter, onOpenPathEditor]);

  // Handle re-vectorization
  const handleRevectorize = useCallback(() => {
    if (selectedCharacter) {
      onRevectorize(selectedCharacter);
    }
  }, [selectedCharacter, onRevectorize]);

  if (!selectedCharacter || !characterData) {
    return (
      <div>
        <div className="card-header">
          <h3 className="card-heading">Character Preview</h3>
        </div>
        <div className="preview-panel-content">
          Select a character to see preview
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h3 className="card-heading">Character Preview</h3>
      </div>
      <div className="character-progress-container">
        <div className="flex gap-2">
          {characterData.status === 'complete' && (
            <button
              onClick={handleRevectorize}
              disabled={isProcessing}
              className="revectorize-button"
            >
              {isProcessing ? 'Processing...' : 'Re-vectorize'}
            </button>
          )}
        </div>
      </div>

      {/* Character Details */}
      {characterData.originalImage && (
        <div className="preview-info-section">
          <div className="preview-info-grid">
            <div className="preview-info-item">
              <span className="preview-info-label">Character:</span>
              <span className="preview-info-value">{characterData.character}</span>
            </div>
            <div className="preview-info-item">
              <span className="preview-info-label">Unicode:</span>
              <span className="preview-info-value">{selectedCharacter}</span>
            </div>
            <div className="preview-info-item">
              <span className="preview-info-label">File Size:</span>
              <span className="preview-info-value">{(characterData.originalImage.metadata.fileSize / 1024).toFixed(1)} KB</span>
            </div>
            <div className="preview-info-item">
              <span className="preview-info-label">Dimensions:</span>
              <span className="preview-info-value">{characterData.originalImage.metadata.dimensions.width}×{characterData.originalImage.metadata.dimensions.height}</span>
            </div>
          </div>
        </div>
      )}

      <div className="preview-container">
        {/* Original Image Preview (Left Side) */}
        <div className="space-y-4">
          <h4 className="preview-section-header">Original Image</h4>
          {characterData.originalImage ? (
            <div className="preview-display-container">
              <img
                src={characterData.originalImage.dataUrl}
                alt={`Original ${characterData.character}`}
                className="preview-image"
              />
            </div>
          ) : (
            <div className="preview-display-container text-gray-500">
              No original image available
            </div>
          )}
        </div>

        {/* Vectorized Glyph Preview (Right Side) */}
        <div className="space-y-4">
          <h4 className="preview-section-header">Vectorized Glyph</h4>
          {characterData.status === 'processing' && (
            <div className="preview-display-container flex-col">
              <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
              <p className="text-blue-600">Vectorizing...</p>
            </div>
          )}

          {characterData.status === 'error' && (
            <div className="preview-display-container flex-col">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-red-600 font-medium">Vectorization Failed</p>
              <p className="text-sm text-gray-600 mt-2">{characterData.errorMessage}</p>
              <button
                onClick={handleRevectorize}
                className="mt-4 btn btn-danger"
              >
                Retry Vectorization
              </button>
            </div>
          )}

          {characterData.status === 'complete' && characterData.vectorData && (
            <div className="space-y-4">
              <div className="preview-display-container">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full max-w-full max-h-full"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                >
                  <path
                    d={characterData.vectorData}
                    fill="currentColor"
                    className="text-gray-900"
                    stroke="none"
                  />
                </svg>
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={handleOpenPathEditor}
                  className="btn btn-primary btn-sm"
                >
                  Open Path Editor
                </button>
              </div>
            </div>
          )}

          {characterData.status === 'uploaded' && (
            <div className="preview-display-container flex-col text-gray-500">
              <div className="loading-spinner h-6 w-6 mx-auto mb-2"></div>
              <p>Waiting for vectorization...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
