import React, { useState, useEffect, useCallback } from 'react';
import { CharacterUploadGrid, CharacterGridFilters, CategoryFilter } from './CharacterUploadGrid/CharacterUploadGrid';
import { CharacterPreviewPanel } from './CharacterPreviewPanel';
import { getDefaultCharacterSet, getAvailableCharacterSets } from '../../data/character-sets';
import { characterDataStorage, CharacterData } from '../../services/storage/CharacterDataStorage';
import { indexedDBManager } from '../../services/storage/IndexedDBManager';
import { useGlyphStore } from '../../stores/useGlyphStore';
import { FontSettingsPanel } from './FontSettingsPanel';
import { FontPreview } from './FontPreview';
import { FontExportPanel } from './FontExportPanel';
import { FontGenerationProgress } from './FontGenerationProgress';
import { FontGenerator, FontProject } from '../../services/font-generation';
import { FontExportService } from '../../services/font-generation';
import { FontSettings, CompiledFont } from '../../types';
import { UseModalReturn } from '../../hooks/useModal';
import { InfoButton } from '../ui/InfoButton';
import { CharacterSetInfoModal } from '../ui/CharacterSetInfoModal';
import { PathEditorModal } from '../ui/PathEditorModal';

export interface FontCreationInterfaceProps {
  exportInfoModal: UseModalReturn;
  characterSetInfoModal: UseModalReturn;
  onCompiledFontChange?: (compiledFont: CompiledFont | null) => void;
  onExportSettingsChange?: (state: {
    exportFormat: 'ttf' | 'otf';
    includeMetadata: boolean;
  }) => void;
}

export const FontCreationInterface: React.FC<FontCreationInterfaceProps> = ({
  exportInfoModal,
  characterSetInfoModal,
  onCompiledFontChange,
  onExportSettingsChange
}) => {

  // Memoize the callback to prevent infinite loops
  const handleExportStateChange = useCallback((state: { exportFormat: 'ttf' | 'otf'; includeMetadata: boolean }) => {
    if (onExportSettingsChange) {
      onExportSettingsChange(state);
    }
  }, [onExportSettingsChange]);
  const [currentCharacterSet, setCurrentCharacterSet] = useState(getDefaultCharacterSet());
  const [characterDataMap, setCharacterDataMap] = useState<Map<string, CharacterData>>(new Map());
  const [selectedCharacter, setSelectedCharacter] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCharacterSetExpanded, setIsCharacterSetExpanded] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Font generation state
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    xHeight: 500,
    capHeight: 700,
    metadata: {
      familyName: 'My Custom Font',
      version: '1.0.0',
      description: 'A custom font created with Glyph Potluck',
      author: '',
      license: 'MIT'
    }
  });
  const [compiledFont, setCompiledFont] = useState<CompiledFont | null>(null);
  const [isGeneratingFont, setIsGeneratingFont] = useState(false);
  const [fontGenerationProgress, setFontGenerationProgress] = useState<any>(null);
  const [showFontProgress, setShowFontProgress] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Path editor modal state
  const [isPathEditorOpen, setIsPathEditorOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<string | undefined>(undefined);

  // Notify parent when compiled font changes
  useEffect(() => {
    if (onCompiledFontChange) {
      onCompiledFontChange(compiledFont);
    }
  }, [compiledFont, onCompiledFontChange]);

  // Calculate upload stats
  const getCharacterUploadStats = useCallback(() => {
    const uploaded = Array.from(characterDataMap.values()).filter(data =>
      data.status !== 'empty'
    ).length;
    const total = currentCharacterSet.characters.length;
    const percentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;

    return { uploaded, total, percentage };
  }, [characterDataMap, currentCharacterSet.characters.length]);

  const uploadStats = getCharacterUploadStats();

  // Access the existing glyph processing functions
  const { processingState } = useGlyphStore();

  // Direct vectorization function that works with files from IndexedDB
  const vectorizeCharacterDirectly = useCallback(async (file: File, params: { quality: 'fast' | 'balanced' | 'high' }) => {
    console.log(`🎯 Direct vectorization for file: ${file.name}`);

    try {
      // Import the vectorization utilities
      const { fileToCanvas, resizeIfNeeded, preprocessImage } = await import('../../utils/imagePreprocessing');

      // Step 1: Convert file to canvas
      const canvas = await fileToCanvas(file);

      // Step 2: Resize if needed
      const resizedCanvas = resizeIfNeeded(canvas, 1024);

      // Step 3: Preprocess image
      const preprocessedCanvas = preprocessImage(resizedCanvas, {
        quality: params.quality,
        noiseReduction: params.quality === 'high'
      });

      // Step 4: Run deterministic marching squares vectorization
      const { vectorizeWithImageTracer } = await import('../../utils/imagetracerVectorization');
      const vectorizationResult = await vectorizeWithImageTracer(
        preprocessedCanvas,
        params,
        (progress, message) => {
          console.log(`⏳ Vectorization Progress: ${progress}% - ${message}`);
        }
      );

      console.log(`✅ Direct vectorization completed for ${file.name}`);
      return vectorizationResult;

    } catch (error) {
      console.error(`❌ Direct vectorization failed for ${file.name}:`, error);
      throw error;
    }
  }, []);

  // Initialize storage and load existing data
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Initializing font creation interface...');

        // Initialize IndexedDB
        await indexedDBManager.initialize();

        // Load existing character data
        const existingData = await characterDataStorage.getAllCharacterData();
        const dataMap = new Map<string, CharacterData>();

        existingData.forEach(data => {
          dataMap.set(data.unicode, data);
        });

        setCharacterDataMap(dataMap);
        setIsInitialized(true);

        console.log('✅ Font creation interface initialized');
        console.log(`📊 Loaded ${existingData.length} existing characters`);
      } catch (error) {
        console.error('❌ Failed to initialize font creation interface:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Handle file upload for a specific character with automatic vectorization
  const handleFileUpload = useCallback(async (file: File, unicode: string) => {
    console.log(`📁 Processing upload for character ${unicode}:`, file.name);

    try {
      // Create character data with uploaded image
      const imageMetadata = {
        fileName: file.name,
        fileSize: file.size,
        dimensions: await getImageDimensions(file),
        uploadTime: new Date()
      };

      const dataUrl = await fileToDataURL(file);

      const characterData: CharacterData = {
        unicode,
        character: String.fromCharCode(parseInt(unicode.replace('U+', ''), 16)),
        originalImage: {
          file,
          dataUrl,
          metadata: imageMetadata
        },
        status: 'uploaded'
      };

      // Store initial upload
      await characterDataStorage.storeCharacterData(characterData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, characterData)));

      // Set to processing status for automatic vectorization
      const processingData = { ...characterData, status: 'processing' as const };
      await characterDataStorage.storeCharacterData(processingData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, processingData)));

      // Auto-vectorize with deterministic high quality
      const vectorizationResult = await vectorizeCharacterDirectly(file, {
        quality: 'high', // Fixed high quality for consistency
      });

      const completeData = {
        ...processingData,
        status: 'complete' as const,
        vectorData: vectorizationResult,
      };
      await characterDataStorage.storeCharacterData(completeData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, completeData)));

      console.log(`✅ Successfully uploaded and vectorized character ${unicode}`);

    } catch (error) {
      console.error(`❌ Failed to process character ${unicode}:`, error);

      const errorData = {
        unicode,
        character: String.fromCharCode(parseInt(unicode.replace('U+', ''), 16)),
        status: 'error' as const,
        errorMessage: error instanceof Error ? error.message : 'Vectorization failed',
      };

      await characterDataStorage.storeCharacterData(errorData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, errorData)));
    }
  }, [vectorizeCharacterDirectly]);


  // Handle character selection for preview
  const handleCharacterSelect = useCallback((unicode: string) => {
    console.log(`🔍 Selected character: ${unicode}`);
    const charData = characterDataMap.get(unicode);
    console.log(`📊 Character data:`, charData);
    console.log(`📊 Character status:`, charData?.status);
    console.log(`📊 Has original image:`, !!charData?.originalImage);
    setSelectedCharacter(unicode);
  }, [characterDataMap]);

  // Handle re-vectorization
  const handleRevectorize = useCallback(async (unicode: string) => {
    const charData = characterDataMap.get(unicode);
    if (!charData?.originalImage) {
      console.error(`❌ No original image found for character ${unicode}`);
      return;
    }

    try {
      // Set to processing status
      const processingData = { ...charData, status: 'processing' as const };
      await characterDataStorage.storeCharacterData(processingData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, processingData)));

      // Convert Blob to File if needed
      const file = charData.originalImage.file instanceof File ?
        charData.originalImage.file :
        new File([charData.originalImage.file], 'character.png', { type: 'image/png' });

      // Re-vectorize with deterministic high quality
      const vectorizationResult = await vectorizeCharacterDirectly(file, {
        quality: 'high', // Fixed high quality for consistency
      });

      const completeData = {
        ...processingData,
        status: 'complete' as const,
        vectorData: vectorizationResult,
      };
      await characterDataStorage.storeCharacterData(completeData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, completeData)));

      console.log(`✅ Successfully re-vectorized character ${unicode}`);

    } catch (error) {
      console.error(`❌ Failed to re-vectorize character ${unicode}:`, error);

      const errorData = {
        ...charData,
        status: 'error' as const,
        errorMessage: error instanceof Error ? error.message : 'Re-vectorization failed',
      };

      await characterDataStorage.storeCharacterData(errorData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, errorData)));
    }
  }, [characterDataMap, vectorizeCharacterDirectly]);

  // Handle path changes from the preview panel
  const handlePathChange = useCallback(async (unicode: string, newPath: string) => {
    const charData = characterDataMap.get(unicode);
    if (charData) {
      const updatedCharData = { ...charData, vectorData: newPath };
      await characterDataStorage.storeCharacterData(updatedCharData);
      setCharacterDataMap(prev => new Map(prev.set(unicode, updatedCharData)));
      console.log(`✅ Saved vector changes for ${unicode}`);
    }
  }, [characterDataMap]);

  // Handle clearing all character data
  const handleClearAll = useCallback(async () => {
    const confirmClear = window.confirm(
      'Are you sure you want to clear all uploaded images and vectorized data? This action cannot be undone.'
    );

    if (!confirmClear) return;

    try {
      console.log('🧹 Clearing all character data...');

      // Clear all data from storage
      await characterDataStorage.clearAllData();

      // Reset the character data map to empty state
      const emptyCharacterDataMap = new Map<string, CharacterData>();
      for (const character of currentCharacterSet.characters) {
        emptyCharacterDataMap.set(character.unicode, {
          unicode: character.unicode,
          character: character.char,
          status: 'empty'
        });
      }

      setCharacterDataMap(emptyCharacterDataMap);
      setSelectedCharacter(undefined);

      console.log('✅ All character data cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear character data:', error);
      alert('Failed to clear character data. Please try again.');
    }
  }, [currentCharacterSet.characters]);



  // Get characters with vectorized data
  const getVectorizedCharacters = useCallback(() => {
    return Array.from(characterDataMap.values())
      .filter(char => char.status === 'complete');
  }, [characterDataMap]);

  // Get upload stats for Clear All button visibility
  const getUploadStats = useCallback(() => {
    const uploaded = Array.from(characterDataMap.values()).filter(data =>
      data.status !== 'empty'
    ).length;
    const total = currentCharacterSet.characters.length;
    const percentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;

    return { uploaded, total, percentage };
  }, [characterDataMap, currentCharacterSet.characters]);

  // Handle character set sub-header toggle
  const handleToggleCharacterSet = useCallback(() => {
    setIsCharacterSetExpanded(!isCharacterSetExpanded);
  }, [isCharacterSetExpanded]);

  // Font generation functions
  const handleGenerateFont = async () => {
    try {
      setIsGeneratingFont(true);
      setShowFontProgress(true);

      // Ensure descender is negative (OpenType.js requirement)
      const adjustedFontSettings = {
        ...fontSettings,
        descender: Math.abs(fontSettings.descender) > 0 ? -Math.abs(fontSettings.descender) : -200
      };

      console.log('🔍 Adjusted font settings for generation:', adjustedFontSettings);

      // Get vectorized characters
      const vectorizedCharacters = new Map<string, CharacterData>();
      for (const [unicode, charData] of characterDataMap) {
        if (charData.vectorData && charData.status === 'complete') {
          vectorizedCharacters.set(unicode, charData);
        }
      }

      if (vectorizedCharacters.size === 0) {
        throw new Error('No vectorized characters available for font generation');
      }

      // Create font project
      const project: FontProject = {
        characters: vectorizedCharacters,
        fontSettings: adjustedFontSettings,
        metadata: {
          name: fontSettings.metadata.familyName,
          description: fontSettings.metadata.description,
          author: fontSettings.metadata.author,
          license: fontSettings.metadata.license,
          version: fontSettings.metadata.version
        }
      };

      // Initialize font generator
      const fontGenerator = new FontGenerator();
      fontGenerator.setProgressCallback((progress) => {
        setFontGenerationProgress(progress);
      });

      // Generate font
      const result = await fontGenerator.generateFont(project);

      if (result.success && result.font) {
        setCompiledFont(result.font);
        console.log('✅ Font generated successfully:', result.font);
      } else {
        throw new Error(result.error || 'Font generation failed');
      }

    } catch (error) {
      console.error('❌ Font generation failed:', error);
      alert(`Font generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingFont(false);
      setShowFontProgress(false);
      setFontGenerationProgress(null);
    }
  };

  const handleFontExport = async (options: any) => {
    if (!compiledFont) return;

    try {
      setIsExporting(true);

      // Export font using the service
      const result = await FontExportService.exportFont(compiledFont, options);

      if (result.success) {
        console.log('✅ Font exported successfully:', result.filename);
      } else {
        throw new Error(result.error || 'Font export failed');
      }

    } catch (error) {
      console.error('❌ Font export failed:', error);
      alert(`Font export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Path editor modal handlers
  const handleOpenPathEditor = useCallback((unicode: string) => {
    setEditingCharacter(unicode);
    setIsPathEditorOpen(true);
  }, []);

  const handleClosePathEditor = useCallback(() => {
    setIsPathEditorOpen(false);
    setEditingCharacter(undefined);
  }, []);

  const handlePathEditorSave = useCallback((newPath: string) => {
    if (editingCharacter) {
      handlePathChange(editingCharacter, newPath);
    }
  }, [editingCharacter, handlePathChange]);

  const canGenerateFont = () => {
    // Check if we have vectorized characters and valid font settings
    const hasVectorizedCharacters = Array.from(characterDataMap.values())
      .some(char => char.vectorData && char.status === 'complete');

    const hasValidSettings = fontSettings.metadata.familyName.trim().length > 0;

    return hasVectorizedCharacters && hasValidSettings;
  };

  const getValidationMessage = () => {
    const hasVectorizedCharacters = Array.from(characterDataMap.values())
      .some(char => char.vectorData && char.status === 'complete');

    const hasValidSettings = fontSettings.metadata.familyName.trim().length > 0;

    if (!hasValidSettings && !hasVectorizedCharacters) {
      return "Please enter a font family name and ensure you have vectorized characters";
    } else if (!hasValidSettings) {
      return "Please enter a font family name";
    } else if (!hasVectorizedCharacters) {
      return "Please ensure you have vectorized characters";
    }

    return "";
  };

  // Helper functions
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Initializing font creation interface...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-lg text-gray-600">Failed to initialize storage system</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableCharacterSets = getAvailableCharacterSets();

  return (
    <div className="content-container">

      {/* Processing Status */}
      {processingState.progress > 0 && processingState.progress < 100 && (
        <div className="processing-status">
          <div className="processing-content">
            <div className="processing-spinner--small"></div>
            <div>
              <p className="processing-title">Processing Character</p>
              <p className="processing-message">{processingState.message}</p>
              <div className="processing-progress">
                <div
                  className="processing-progress-fill"
                  style={{ width: `${processingState.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Character Grid + Character Preview */}
      <div className="content-grid content-grid--two-columns">
        {/* Unified Character Management Card */}
        <div className="card character-management-card">
          <div className="card-header card-header--collapsible">
            <h3 className="card-heading">
              Character Set
            </h3>
            <button
              className="collapse-trigger collapse-trigger--header"
              onClick={handleToggleCharacterSet}
              aria-expanded={isCharacterSetExpanded}
              aria-controls="character-set-subheader"
              title={isCharacterSetExpanded ? "Collapse character set options" : "Expand character set options"}
            >
              <span className={`chevron-icon ${isCharacterSetExpanded ? 'chevron-icon--up' : 'chevron-icon--down'}`}></span>
            </button>
            <InfoButton
              onClick={characterSetInfoModal.open}
              tooltip="Character Set Information"
              className="info-button--inline"
            />
          </div>

          {/* Collapsible Sub-Header */}
          <div
            id="character-set-subheader"
            className={`card-subheader ${isCharacterSetExpanded ? 'card-subheader--expanded' : 'card-subheader--collapsed'}`}
          >
            <div className="card-subheader-content">
              {/* Character Set Selector Section */}
              <div className="card-subheader-section">
                <div className="character-set-controls">
                  <div className="character-set-row">
                    <div className="selector-group">
                      <select
                        id="character-set"
                        value={currentCharacterSet.id}
                        onChange={(e) => {
                          const set = availableCharacterSets.find(s => s.id === e.target.value);
                          if (set) setCurrentCharacterSet(set);
                        }}
                        className="form-select"
                      >
                        {availableCharacterSets.map(set => (
                          <option key={set.id} value={set.id}>
                            {set.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Progress Container */}
              <div className="card-subheader-section">
                <div className="character-progress-container">
                  <div className="character-grid-stats">
                    {uploadStats.uploaded} of {uploadStats.total} characters uploaded ({uploadStats.percentage}%)
                  </div>
                  <div className="character-grid-progress">
                    <div
                      className="character-grid-progress-fill"
                      style={{ width: `${uploadStats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Character Grid Filters */}
              <div className="card-subheader-section">
                <CharacterGridFilters
                  characterSet={currentCharacterSet}
                  characterDataMap={characterDataMap}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                />
              </div>

            </div>
          </div>

          {/* Character Grid Section - Always Visible */}
          <div className="character-grid-section">
            <CharacterUploadGrid
              characterSet={currentCharacterSet}
              characterDataMap={characterDataMap}
              onFileUpload={handleFileUpload}
              onCharacterSelect={handleCharacterSelect}
              selectedCharacter={selectedCharacter}
              showCategories={false}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>

          {/* Card Footer with Clear Action */}
          {getUploadStats().uploaded > 0 && (
            <div className="card-footer card-footer--right">
              <button
                onClick={handleClearAll}
                className="btn-danger btn-sm"
                title="Clear uploaded images and vectorized data"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Character Preview Section */}
        <div className="card">
          <CharacterPreviewPanel
            selectedCharacter={selectedCharacter}
            characterData={selectedCharacter ? characterDataMap.get(selectedCharacter) : undefined}
            onRevectorize={handleRevectorize}
            isProcessing={selectedCharacter ? characterDataMap.get(selectedCharacter)?.status === 'processing' : false}
            onOpenPathEditor={handleOpenPathEditor}
          />
        </div>
      </div>


      {/* Font Generation Section */}
      {getVectorizedCharacters().length > 0 && (
        <div className="content-grid content-grid--three-columns">
          {/* Font Settings */}
          <div className="lg:grid-responsive-1">
            <FontSettingsPanel
              settings={fontSettings}
              onSettingsChange={setFontSettings}
              onGenerateFont={handleGenerateFont}
              canGenerate={canGenerateFont()}
              isGenerating={isGeneratingFont}
              validationMessage={!canGenerateFont() ? getValidationMessage() : undefined}
            />
          </div>

          {/* Font Preview & Export */}
          <div className="lg:grid-responsive-2">
            <div className="content-grid">
              <FontPreview
                fontSettings={fontSettings}
                characterData={characterDataMap}
                compiledFont={compiledFont?.fontData || null}
                isGenerating={isGeneratingFont}
              />

              <FontExportPanel
                compiledFont={compiledFont}
                fontSettings={fontSettings}
                characterCount={getVectorizedCharacters().length}
                onExport={handleFontExport}
                isExporting={isExporting}
                exportInfoModal={exportInfoModal}
                onExportStateChange={handleExportStateChange}
              />
            </div>
          </div>
        </div>
      )}


      {/* Font Generation Progress Modal */}
      <FontGenerationProgress
        progress={fontGenerationProgress}
        isVisible={showFontProgress}
      />

      {/* Path Editor Modal */}
      {editingCharacter && (
        <PathEditorModal
          isOpen={isPathEditorOpen}
          onClose={handleClosePathEditor}
          glyphId={editingCharacter}
          initialPath={characterDataMap.get(editingCharacter)?.vectorData || ''}
          fontMetrics={{
            unitsPerEm: 200, // Match the 200x200 viewBox
            ascender: fontSettings.ascender * 0.2, // Scale from 1000 to 200 units
            descender: fontSettings.descender * 0.2,
            xHeight: fontSettings.xHeight * 0.2,
            capHeight: fontSettings.capHeight * 0.2,
            baseline: 100, // Center baseline in 200x200 canvas
            lineGap: 0,
            underlinePosition: 0,
            underlineThickness: 0
          }}
          onPathChanged={handlePathEditorSave}
          character={characterDataMap.get(editingCharacter)?.character}
          unicode={editingCharacter}
        />
      )}

      {/* Character Set Info Modal */}
      <CharacterSetInfoModal
        isOpen={characterSetInfoModal.isOpen}
        onClose={characterSetInfoModal.close}
        characterSet={currentCharacterSet}
        uploadedCount={getUploadStats().uploaded}
        totalCount={getUploadStats().total}
      />
    </div>
  );
};
