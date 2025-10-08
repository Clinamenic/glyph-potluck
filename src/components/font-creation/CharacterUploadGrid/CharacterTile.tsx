import React, { useRef, useState } from 'react';
import { CharacterDefinition } from '../../../data/character-sets';
import { CharacterData } from '../../../services/storage/CharacterDataStorage';

interface CharacterTileProps {
  character: CharacterDefinition;
  characterData?: CharacterData;
  onFileUpload: (file: File, unicode: string) => void;
  onSelect: (unicode: string) => void;
  isSelected: boolean;
  size?: 'small' | 'medium' | 'large';
}


export const CharacterTile: React.FC<CharacterTileProps> = ({
  character,
  characterData,
  onFileUpload,
  onSelect,
  isSelected
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Use a fixed viewBox that works for most glyphs
  const svgViewBox = '0 0 200 200';

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onFileUpload(file, character.unicode);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    onSelect(character.unicode);
  };

  const handleUploadClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const getStatusClass = () => {
    if (!characterData) return '';

    switch (characterData.status) {
      case 'uploaded':
        return 'uploaded';
      case 'processing':
        return 'processing';
      case 'vectorized':
      case 'complete':
        return 'complete';
      case 'error':
        return 'error';
      default:
        return '';
    }
  };


  const getStatusIndicator = () => {
    if (!characterData) return null;

    const baseClasses = "character-status-indicator";

    switch (characterData.status) {
      case 'uploaded':
        return (
          <div className={`${baseClasses} status-uploaded`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className={`${baseClasses} status-processing`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
        );
      case 'vectorized':
      case 'complete':
        return (
          <div className={`${baseClasses} status-complete`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`${baseClasses} status-error`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`character-tile ${getStatusClass()} ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      title={`${character.name} (${character.unicode})`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Enhanced status indicator */}
      {getStatusIndicator()}

      {/* Character display or thumbnail */}
      {characterData?.vectorData ? (
        <svg
          viewBox={svgViewBox}
          className="vectorized-character-svg"
          style={{
            width: '100%',
            height: '100%'
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={characterData.vectorData}
            fill="var(--gray-700)"
            stroke="none"
          />
        </svg>
      ) : characterData?.originalImage ? (
        <img
          src={characterData.originalImage.dataUrl}
          alt={`Upload for ${character.char}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
        />
      ) : (
        <span className="character-display">
          {character.char === ' ' ? '␣' : character.char}
        </span>
      )}

      {/* Upload button overlay (visible on hover) */}
      <div className="tile-overlay">
        <button
          onClick={handleUploadClick}
          className="btn btn-secondary tile-upload-btn"
          title={characterData?.originalImage ? 'Replace image' : 'Upload image'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Unicode label */}
      <div className="unicode-label">
        {character.unicode.replace('U+', '')}
      </div>

      {/* Processing overlay */}
      {characterData?.status === 'processing' && (
        <div className="processing-overlay">
          <div className="loading-spinner h-6 w-6"></div>
        </div>
      )}
    </div>
  );
};
