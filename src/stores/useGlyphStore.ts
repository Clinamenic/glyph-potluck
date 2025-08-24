import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GlyphStore, UploadedFile, ProcessedGlyph, VectorizationParams } from '@/types';
import { APP_CONFIG } from '@/types';

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
      selectedQuality: 'balanced',

      // Actions
      addFiles: async (files: File[]) => {
        set((state) => ({
          processingState: {
            ...state.processingState,
            status: 'processing',
            progress: 0,
            message: 'Processing uploaded files...',
          },
        }), false, 'addFiles:start');

        try {
          const validFiles = files.filter(validateFile);
          const uploadedFiles: UploadedFile[] = [];

          for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
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
          console.error('Error adding files:', error);
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
        const { uploadedFiles } = get();
        const file = uploadedFiles.find(f => f.id === fileId);
        
        if (!file) {
          console.error('File not found for processing:', fileId);
          return;
        }

        set(() => ({
          processingState: {
            status: 'processing',
            progress: 0,
            message: `Vectorizing ${file.name}...`,
          },
        }), false, 'processGlyph:start');

        try {
          // Simulate vectorization process for now
          // This will be replaced with actual vectorization logic
          await simulateVectorization(file, params, (progress, message) => {
            set((state) => ({
              processingState: {
                ...state.processingState,
                progress,
                message,
              },
            }), false, 'processGlyph:progress');
          });

          // Create processed glyph (mock data for now)
          const processedGlyph: ProcessedGlyph = {
            id: generateId(),
            originalFile: file,
            svgPaths: [`M 100 100 L 200 200 L 150 250 Z`], // Mock SVG path
            vectorData: {
              paths: [
                { command: 'M', values: [100, 100] },
                { command: 'L', values: [200, 200] },
                { command: 'L', values: [150, 250] },
                { command: 'Z', values: [] },
              ],
              bounds: { x: 100, y: 100, width: 100, height: 150 },
            },
            processingParams: params,
            processed: new Date(),
          };

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
          console.error('Error processing glyph:', error);
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

      clearAll: () => {
        set({
          uploadedFiles: [],
          processedGlyphs: [],
          processingState: initialProcessingState,
          selectedQuality: 'balanced',
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

async function simulateVectorization(
  _file: UploadedFile,
  _params: VectorizationParams,
  onProgress: (progress: number, message: string) => void
): Promise<void> {
  const steps = [
    'Loading image...',
    'Preprocessing image...',
    'Detecting edges...',
    'Tracing paths...',
    'Optimizing vectors...',
    'Finalizing...',
  ];

  for (let i = 0; i < steps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    const progress = ((i + 1) / steps.length) * 100;
    onProgress(progress, steps[i]);
  }
}

// Selector hooks
export const useUploadedFiles = () => useGlyphStore((state) => state.uploadedFiles);
export const useProcessedGlyphs = () => useGlyphStore((state) => state.processedGlyphs);
export const useProcessingState = () => useGlyphStore((state) => state.processingState);
export const useSelectedQuality = () => useGlyphStore((state) => state.selectedQuality);
