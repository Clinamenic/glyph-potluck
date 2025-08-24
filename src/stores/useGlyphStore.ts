import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GlyphStore, UploadedFile, ProcessedGlyph, VectorizationParams, VectorizationQuality } from '@/types';
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
          // Enhanced vectorization simulation with better mock data
          console.log(`🎯 Using ${params.quality} quality vectorization`);
          
          await simulateVectorization(file, params, (progress, message) => {
            console.log(`⏳ Progress: ${progress}% - ${message}`);
            set((state) => ({
              processingState: {
                ...state.processingState,
                progress,
                message,
              },
            }), false, 'processGlyph:progress');
          });

          // Create more realistic mock SVG data based on quality
          const svgPath = generateMockSVGPath(params.quality);
          const processedGlyph: ProcessedGlyph = {
            id: generateId(),
            originalFile: file,
            svgPaths: [svgPath],
            vectorData: {
              paths: parseSVGPath(svgPath),
              bounds: { x: 50, y: 50, width: 200, height: 250 },
            },
            processingParams: params,
            processed: new Date(),
          };

          console.log('✅ Vectorization completed successfully:', {
            glyphId: processedGlyph.id,
            svgPathLength: svgPath.length,
            quality: params.quality
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function generateMockSVGPath(quality: VectorizationQuality): string {
  // Generate different complexity paths based on quality
  switch (quality) {
    case 'fast':
      // Simple rectangular path
      return 'M 60 60 L 180 60 L 180 180 L 60 180 Z';
    case 'balanced':
      // Letter-like path with curves
      return 'M 80 50 Q 120 30 160 50 L 160 200 Q 120 220 80 200 L 80 120 L 140 120 L 140 100 L 80 100 Z';
    case 'high':
      // Complex path with multiple curves
      return 'M 75 45 Q 95 25 125 35 Q 155 25 175 45 Q 185 75 175 105 L 175 180 Q 165 210 135 205 Q 105 210 95 180 L 95 105 Q 85 75 75 45 M 110 70 Q 130 60 150 70 L 150 85 Q 130 95 110 85 Z';
    default:
      return 'M 100 100 L 150 100 L 150 150 L 100 150 Z';
  }
}

function parseSVGPath(pathString: string): any[] {
  // Simple SVG path parser for mock data
  const commands = pathString.split(/(?=[MLHVCSQTAZ])/i);
  return commands.map(cmd => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const values = parts.slice(1).map(Number);
    return { command, values };
  });
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
