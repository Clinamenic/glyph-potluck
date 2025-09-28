import React, { useState, useCallback } from 'react';
import { CharacterData } from '../../services/storage/CharacterDataStorage';
import { InteractiveSVGEditor } from '../ui/InteractiveSVGEditor';

interface CharacterPreviewPanelProps {
  selectedCharacter: string | undefined;
  characterData: CharacterData | undefined;
  onRevectorize: (unicode: string) => void;
  onPathChange: (unicode: string, newPath: string) => void;
  isProcessing: boolean;
}

export const CharacterPreviewPanel: React.FC<CharacterPreviewPanelProps> = ({
  selectedCharacter,
  characterData,
  onRevectorize,
  onPathChange,
  isProcessing
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVectorData, setEditingVectorData] = useState<string>('');

  // Handle edit mode toggle
  const handleEditModeToggle = useCallback(() => {
    if (characterData?.vectorData) {
      setEditingVectorData(characterData.vectorData);
      setIsEditMode(true);
    }
  }, [characterData]);

  // Handle path changes from the editor
  const handlePathChange = useCallback((newPath: string) => {
    setEditingVectorData(newPath);
  }, []);

  // Handle save changes
  const handleSaveChanges = useCallback(() => {
    if (selectedCharacter && editingVectorData) {
      onPathChange(selectedCharacter, editingVectorData);
      setIsEditMode(false);
      setEditingVectorData('');
    }
  }, [selectedCharacter, editingVectorData, onPathChange]);

  // Handle reset changes
  const handleResetChanges = useCallback(() => {
    if (characterData?.vectorData) {
      setEditingVectorData(characterData.vectorData);
    }
  }, [characterData]);

  // Handle re-vectorization
  const handleRevectorize = useCallback(() => {
    if (selectedCharacter) {
      onRevectorize(selectedCharacter);
    }
  }, [selectedCharacter, onRevectorize]);

  if (!selectedCharacter || !characterData) {
    return (
      <div className="preview-panel">
        <h3>Character Preview</h3>
        <div className="text-center text-gray-500 py-8">
          Select a character to see preview
        </div>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="flex justify-between items-center mb-4">
        <h3>Character Preview</h3>
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
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Character:</strong> {characterData.character}
            </div>
            <div>
              <strong>Unicode:</strong> {selectedCharacter}
            </div>
            <div>
              <strong>File Size:</strong> {(characterData.originalImage.metadata.fileSize / 1024).toFixed(1)} KB
            </div>
            <div>
              <strong>Dimensions:</strong> {characterData.originalImage.metadata.dimensions.width}×{characterData.originalImage.metadata.dimensions.height}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Original Image Preview (Left Side) */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Original Image</h4>
          {characterData.originalImage ? (
            <div className="text-center bg-gray-50 rounded p-4 h-64 flex items-center justify-center">
              <img
                src={characterData.originalImage.dataUrl}
                alt={`Original ${characterData.character}`}
                className="w-full h-full max-w-full max-h-full mx-auto border rounded object-contain"
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 h-64 flex items-center justify-center">
              No original image available
            </div>
          )}
        </div>

        {/* Vectorized Glyph Preview (Right Side) */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Vectorized Glyph</h4>
          {characterData.status === 'processing' && (
            <div className="text-center bg-gray-50 rounded p-4 h-64 flex flex-col items-center justify-center">
              <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
              <p className="text-blue-600">Vectorizing...</p>
            </div>
          )}
          
          {characterData.status === 'error' && (
            <div className="text-center bg-gray-50 rounded p-4 h-64 flex flex-col items-center justify-center">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-red-600 font-medium">Vectorization Failed</p>
              <p className="text-sm text-gray-600 mt-2">{characterData.errorMessage}</p>
              <button
                onClick={handleRevectorize}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Retry Vectorization
              </button>
            </div>
          )}

          {characterData.status === 'complete' && characterData.vectorData && (
            <div className="space-y-4">
              <div className="text-center bg-gray-50 rounded p-4 h-64 flex items-center justify-center">
                {isEditMode && editingVectorData ? (
                  <div className="w-full h-full">
                    <InteractiveSVGEditor
                      glyphId={selectedCharacter}
                      initialPath={editingVectorData}
                      onPathChanged={handlePathChange}
                      viewBox={{ width: 200, height: 200 }}
                      readOnly={false}
                    />
                  </div>
                ) : (
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
                )}
              </div>
              
              <div className="flex justify-center gap-2">
                {!isEditMode ? (
                  <button 
                    onClick={handleEditModeToggle}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Edit Vector
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSaveChanges}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={handleResetChanges}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setIsEditMode(false)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {characterData.status === 'uploaded' && (
            <div className="text-center bg-gray-50 rounded p-4 h-64 flex flex-col items-center justify-center text-gray-500">
              <div className="loading-spinner h-6 w-6 mx-auto mb-2"></div>
              <p>Waiting for vectorization...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
