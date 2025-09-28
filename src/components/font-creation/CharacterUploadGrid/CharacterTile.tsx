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
        return <div className={`${baseClasses} status-uploaded`}>📁</div>;
      case 'processing':
        return <div className={`${baseClasses} status-processing`}>⏳</div>;
      case 'vectorized':
      case 'complete':
        return <div className={`${baseClasses} status-complete`}>✅</div>;
      case 'error':
        return <div className={`${baseClasses} status-error`}>❌</div>;
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
      {characterData?.originalImage ? (
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
          className="tile-button"
        >
          {characterData?.originalImage ? 'Replace' : 'Upload'}
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
