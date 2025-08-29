import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GlyphStore, UploadedFile, ProcessedGlyph, VectorizationParams } from '@/types';
import { APP_CONFIG } from '@/types';
import { fileToCanvas, preprocessImage, resizeIfNeeded } from '@/utils/imagePreprocessing';
import { vectorizeWithTraceTargetPerfect, parseSVGPath, calculateBounds } from '@/utils/imagetracerVectorization';

const initialProcessingState = {
  status: 'idle' as const,
  progress: 0,
  message: undefined,
  error: undefined,
};

export const useGlyphStore = create<GlyphStore>()(
  devtools(
    (set, get) => ({
      // State
      uploadedFiles: [],
      processedGlyphs: [],
      processingState: initialProcessingState,
      selectedQuality: 'high',

      // Actions
      addFiles: async (files: File[]) => {
        console.log('📁 Starting file upload process...', { fileCount: files.length });
        
        set((state) => ({
          processingState: {
            ...state.processingState,
            status: 'processing',
            progress: 0,
            message: 'Processing uploaded files...',
          },
        }), false, 'addFiles:start');

        try {
          console.log('🔍 Validating files...');
          const validFiles = files.filter((file, index) => {
            const isValid = validateFile(file);
            console.log(`File ${index + 1}: ${file.name} - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
            return isValid;
          });
          
          if (validFiles.length === 0) {
            throw new Error('No valid files found. Please upload PNG, JPG, or WebP images.');
          }

          console.log(`✅ ${validFiles.length} valid files found, processing...`);
          const uploadedFiles: UploadedFile[] = [];

          for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            console.log(`📤 Processing file ${i + 1}/${validFiles.length}: ${file.name}`);
            
            const dataUrl = await fileToDataUrl(file);
            
            const uploadedFile: UploadedFile = {
              id: generateId(),
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl,
              uploaded: new Date(),
            };

            uploadedFiles.push(uploadedFile);
            console.log(`✅ File processed: ${file.name} (${formatFileSize(file.size)})`);

            // Update progress
            const progress = ((i + 1) / validFiles.length) * 100;
            set((state) => ({
              processingState: {
                ...state.processingState,
                progress,
                message: `Processing file ${i + 1} of ${validFiles.length}...`,
              },
            }), false, 'addFiles:progress');
          }

          console.log(`🎉 Successfully uploaded ${uploadedFiles.length} files`);
          set((state) => ({
            uploadedFiles: [...state.uploadedFiles, ...uploadedFiles],
            processingState: {
              status: 'completed',
              progress: 100,
              message: `Successfully uploaded ${uploadedFiles.length} files`,
            },
          }), false, 'addFiles:complete');

          // Clear processing state after a delay
          setTimeout(() => {
            set(() => ({
              processingState: initialProcessingState,
            }), false, 'addFiles:clearState');
          }, 2000);

        } catch (error) {
          console.error('❌ Error adding files:', error);
          set(() => ({
            processingState: {
              status: 'error',
              progress: 0,
              message: 'Failed to process files',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }), false, 'addFiles:error');
        }
      },

      removeFile: (fileId: string) => {
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter(f => f.id !== fileId),
          processedGlyphs: state.processedGlyphs.filter(g => g.originalFile.id !== fileId),
        }), false, 'removeFile');
      },

      processGlyph: async (fileId: string, params: VectorizationParams) => {
        console.log('🔄 Starting vectorization process...', { fileId, quality: params.quality });
        
        const { uploadedFiles } = get();
        const file = uploadedFiles.find(f => f.id === fileId);
        
        if (!file) {
          console.error('❌ File not found for processing:', fileId);
          return;
        }

        console.log('📝 Processing file:', { name: file.name, size: file.size, type: file.type });

        set(() => ({
          processingState: {
            status: 'processing',
            progress: 0,
            message: `Vectorizing ${file.name}...`,
          },
        }), false, 'processGlyph:start');

        try {
          // TRACE TARGET PERFECT single method vectorization
          console.log(`🎯 Using ${params.quality} quality vectorization`);
          
          // Step 1: Convert file to canvas
          set((state) => ({
            processingState: {
              ...state.processingState,
              progress: 10,
              message: 'Converting image to canvas...',
            },
          }), false, 'processGlyph:canvas');
          
          const canvas = await fileToCanvas(file.file);
          
          // Step 2: Resize if needed
          set((state) => ({
            processingState: {
              ...state.processingState,
              progress: 20,
              message: 'Optimizing image size...',
            },
          }), false, 'processGlyph:resize');
          
          const resizedCanvas = resizeIfNeeded(canvas, 1024);
          
          // Step 3: Preprocess image
          set((state) => ({
            processingState: {
              ...state.processingState,
              progress: 30,
              message: 'Preprocessing image...',
            },
          }), false, 'processGlyph:preprocess');
          
          const preprocessedCanvas = preprocessImage(resizedCanvas, { 
            quality: params.quality,
            noiseReduction: params.quality === 'high'
          });
          
          // Step 4: Run Trace Target Perfect vectorization
          set((state) => ({
            processingState: {
              ...state.processingState,
              progress: 40,
              message: 'Starting vectorization...',
            },
          }), false, 'processGlyph:vectorize');
          
          const vectorizationResult = await vectorizeWithTraceTargetPerfect(
            preprocessedCanvas,
            params,
            (progress, message) => {
              console.log(`⏳ Vectorization Progress: ${progress}% - ${message}`);
              set((state) => ({
                processingState: {
                  ...state.processingState,
                  progress: 40 + (progress * 0.5), // Map 0-100 to 40-90
                  message,
                },
              }), false, 'processGlyph:vectorize');
            }
          );

          // Step 5: Process vectorization result
          set((state) => ({
            processingState: {
              ...state.processingState,
              progress: 95,
              message: 'Processing vectorization result...',
            },
          }), false, 'processGlyph:results');

          // Create single glyph with Trace Target Perfect result
          const pathCommands = parseSVGPath(vectorizationResult);
          const bounds = calculateBounds(vectorizationResult);
          
          const processedGlyph: ProcessedGlyph = {
            id: generateId(),
            originalFile: file,
            svgPaths: [vectorizationResult],
            vectorData: {
              paths: pathCommands,
              bounds,
            },
            processingParams: params,
            processed: new Date(),

            methodId: "trace-target-perfect",
          };

          console.log('✅ Vectorization completed successfully:', {
            file: file.name,
            quality: params.quality,
            pathLength: vectorizationResult.length
          });

          set((state) => ({
            processedGlyphs: [...state.processedGlyphs, processedGlyph],
            processingState: {
              status: 'completed',
              progress: 100,
              message: `Successfully vectorized ${file.name}`,
            },
          }), false, 'processGlyph:complete');

          // Clear processing state
          setTimeout(() => {
            set(() => ({
              processingState: initialProcessingState,
            }), false, 'processGlyph:clearState');
          }, 2000);

        } catch (error) {
          console.error('❌ Error processing glyph:', error);
          set(() => ({
            processingState: {
              status: 'error',
              progress: 0,
              message: 'Failed to vectorize image',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }), false, 'processGlyph:error');
        }
      },

      updateGlyphCharacter: (glyphId: string, character: string) => {
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph =>
            glyph.id === glyphId ? { ...glyph, character } : glyph
          ),
        }), false, 'updateGlyphCharacter');
      },

      // Path editing actions
      updateGlyphPath: (glyphId: string, newPath: string) => {
        console.log(`🖊️ Updating path for glyph ${glyphId}`);
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph => {
            if (glyph.id === glyphId) {
              // Parse the new path and update vector data
              const pathCommands = parseSVGPath(newPath);
              const bounds = calculateBounds(newPath);
              
              return {
                ...glyph,
                svgPaths: [newPath],
                vectorData: {
                  paths: pathCommands,
                  bounds,
                },
              };
            }
            return glyph;
          }),
        }), false, 'updateGlyphPath');
      },

      setEditablePathData: (glyphId: string, pathData: import('@/types').EditablePathData) => {
        console.log(`📝 Setting editable path data for glyph ${glyphId}`);
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph => {
            if (glyph.id === glyphId) {
              return {
                ...glyph,
                editablePathData: pathData,
              };
            }
            return glyph;
          }),
        }), false, 'setEditablePathData');
      },

      addPathEditToHistory: (glyphId: string, pathData: import('@/types').EditablePathData) => {
        console.log(`📚 Adding path edit to history for glyph ${glyphId}`);
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph => {
            if (glyph.id === glyphId) {
              const currentHistory = glyph.editHistory || [];
              const currentIndex = glyph.currentEditIndex || -1;
              
              // Remove any history after current index (if user made changes after undoing)
              const newHistory = currentHistory.slice(0, currentIndex + 1);
              newHistory.push(pathData);
              
              // Limit history size to 50 operations
              const limitedHistory = newHistory.slice(-50);
              
              return {
                ...glyph,
                editHistory: limitedHistory,
                currentEditIndex: limitedHistory.length - 1,
                editablePathData: pathData,
              };
            }
            return glyph;
          }),
        }), false, 'addPathEditToHistory');
      },

      undoPathEdit: (glyphId: string) => {
        console.log(`↶ Undoing path edit for glyph ${glyphId}`);
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph => {
            if (glyph.id === glyphId && glyph.editHistory && glyph.currentEditIndex !== undefined) {
              const newIndex = Math.max(0, glyph.currentEditIndex - 1);
              const pathData = glyph.editHistory[newIndex];
              
              if (pathData) {
                return {
                  ...glyph,
                  currentEditIndex: newIndex,
                  editablePathData: pathData,
                };
              }
            }
            return glyph;
          }),
        }), false, 'undoPathEdit');
      },

      redoPathEdit: (glyphId: string) => {
        console.log(`↷ Redoing path edit for glyph ${glyphId}`);
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph => {
            if (glyph.id === glyphId && glyph.editHistory && glyph.currentEditIndex !== undefined) {
              const newIndex = Math.min(glyph.editHistory.length - 1, glyph.currentEditIndex + 1);
              const pathData = glyph.editHistory[newIndex];
              
              if (pathData && newIndex !== glyph.currentEditIndex) {
                return {
                  ...glyph,
                  currentEditIndex: newIndex,
                  editablePathData: pathData,
                };
              }
            }
            return glyph;
          }),
        }), false, 'redoPathEdit');
      },

      resetGlyphToOriginal: (glyphId: string) => {
        console.log(`🔄 Resetting glyph ${glyphId} to original path`);
        set((state) => ({
          processedGlyphs: state.processedGlyphs.map(glyph => {
            if (glyph.id === glyphId && glyph.editablePathData) {
              const originalPath = glyph.editablePathData.originalPath;
              const pathCommands = parseSVGPath(originalPath);
              const bounds = calculateBounds(originalPath);
              
              return {
                ...glyph,
                svgPaths: [originalPath],
                vectorData: {
                  paths: pathCommands,
                  bounds,
                },
                editablePathData: undefined,
                editHistory: [],
                currentEditIndex: undefined,
              };
            }
            return glyph;
          }),
        }), false, 'resetGlyphToOriginal');
      },

      clearAll: () => {
        set({
          uploadedFiles: [],
          processedGlyphs: [],
          processingState: initialProcessingState,
          selectedQuality: 'high',
        }, false, 'clearAll');
      },
    }),
    {
      name: 'glyph-potluck-glyph-store',
    }
  )
);

// Helper functions
function validateFile(file: File): boolean {
  // Check file type
  if (!APP_CONFIG.SUPPORTED_FORMATS.includes(file.type as any)) {
    console.warn(`Unsupported file type: ${file.type}`);
    return false;
  }

  // Check file size
  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    console.warn(`File too large: ${file.size} bytes`);
    return false;
  }

  return true;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Mock functions removed - now using real ImageTracer vectorization

// Selector hooks
export const useUploadedFiles = () => useGlyphStore((state) => state.uploadedFiles);
export const useProcessedGlyphs = () => useGlyphStore((state) => state.processedGlyphs);
export const useProcessingState = () => useGlyphStore((state) => state.processingState);
export const useSelectedQuality = () => useGlyphStore((state) => state.selectedQuality);
