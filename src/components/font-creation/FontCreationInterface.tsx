import React, { useState, useEffect, useCallback } from 'react';
import { CharacterUploadGrid } from './CharacterUploadGrid/CharacterUploadGrid';
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

export const FontCreationInterface: React.FC = () => {
  const [currentCharacterSet, setCurrentCharacterSet] = useState(getDefaultCharacterSet());
  const [characterDataMap, setCharacterDataMap] = useState<Map<string, CharacterData>>(new Map());
  const [selectedCharacter, setSelectedCharacter] = useState<string | undefined>(undefined);
  const [searchFilter, setSearchFilter] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Font generation state
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    xHeight: 500,
    capHeight: 700,
    metadata: {
      familyName: 'My Custom Font',
      style: 'Regular',
      weight: 400,
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

  // Access the existing glyph processing functions
  const { processingState } = useGlyphStore();

  // Direct vectorization function that works with files from IndexedDB
  const vectorizeCharacterDirectly = useCallback(async (file: File, params: { quality: 'fast' | 'balanced' | 'high' }) => {
    console.log(`🎯 Direct vectorization for file: ${file.name}`);
    
    try {
      // Import the vectorization utilities
      const { vectorizeWithTraceTargetPerfect } = await import('../../utils/imagetracerVectorization');
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
      
      // Step 4: Run Trace Target Perfect vectorization
      const vectorizationResult = await vectorizeWithTraceTargetPerfect(
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



  // Get characters with vectorized data
  const getVectorizedCharacters = useCallback(() => {
    return Array.from(characterDataMap.values())
      .filter(char => char.status === 'complete');
  }, [characterDataMap]);


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

  const canGenerateFont = () => {
    // Check if we have vectorized characters and valid font settings
    const hasVectorizedCharacters = Array.from(characterDataMap.values())
      .some(char => char.vectorData && char.status === 'complete');
    
    const hasValidSettings = fontSettings.metadata.familyName.trim().length > 0;
    
    return hasVectorizedCharacters && hasValidSettings;
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Font Creation Studio
        </h1>
        <p className="text-lg text-gray-600">
          Upload images for each character to create your custom font
        </p>
      </div>

      {/* Character Set Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <label htmlFor="character-set" className="font-medium text-gray-700">
              Character Set:
            </label>
            <select
              id="character-set"
              value={currentCharacterSet.id}
              onChange={(e) => {
                const set = availableCharacterSets.find(s => s.id === e.target.value);
                if (set) setCurrentCharacterSet(set);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCharacterSets.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name} ({set.characters.length} characters)
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <label htmlFor="search" className="text-sm text-gray-600">
              Search:
            </label>
            <input
              id="search"
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Character or name..."
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        {/* Character set description */}
        <p className="text-sm text-gray-600 mt-2">
          {currentCharacterSet.description}
        </p>
      </div>

      {/* Processing Status */}
      {processingState.progress > 0 && processingState.progress < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <div>
              <p className="font-medium text-blue-900">Processing Character</p>
              <p className="text-sm text-blue-700">{processingState.message}</p>
              <div className="w-64 bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingState.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Character Grid + Character Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character Upload Grid */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CharacterUploadGrid
            characterSet={currentCharacterSet}
            characterDataMap={characterDataMap}
            onFileUpload={handleFileUpload}
            onCharacterSelect={handleCharacterSelect}
            selectedCharacter={selectedCharacter}
            showCategories={true}
            searchFilter={searchFilter}
          />
        </div>

        {/* Character Preview Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CharacterPreviewPanel
            selectedCharacter={selectedCharacter}
            characterData={selectedCharacter ? characterDataMap.get(selectedCharacter) : undefined}
            onRevectorize={handleRevectorize}
            onPathChange={handlePathChange}
            isProcessing={selectedCharacter ? characterDataMap.get(selectedCharacter)?.status === 'processing' : false}
          />
        </div>
      </div>


      {/* Font Generation Section */}
      {getVectorizedCharacters().length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Font Settings */}
          <div className="lg:col-span-1">
            <FontSettingsPanel
              settings={fontSettings}
              onSettingsChange={setFontSettings}
              onGenerateFont={handleGenerateFont}
              canGenerate={canGenerateFont()}
              isGenerating={isGeneratingFont}
            />
          </div>

          {/* Font Preview & Export */}
          <div className="lg:col-span-2 space-y-6">
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
            />
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Quick Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Upload clear, high-contrast images for best vectorization results</li>
          <li>• PNG format with transparent background works best</li>
          <li>• Each character will be automatically vectorized after upload</li>
          <li>• Click on any uploaded character to view and edit the vector result</li>
          <li>• You need at least A, a, 0, and space characters for a functional font</li>
          <li>• Configure font settings and generate your custom font after vectorization</li>
          <li>• Export your font in TTF or OTF format for use in design software</li>
        </ul>
      </div>

      {/* Font Generation Progress Modal */}
      <FontGenerationProgress
        progress={fontGenerationProgress}
        isVisible={showFontProgress}
      />
    </div>
  );
};
