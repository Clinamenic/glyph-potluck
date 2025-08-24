import { useCallback, useState, DragEvent } from 'react';
import { APP_CONFIG } from '@/types';
import { useProcessingState } from '@/stores/useGlyphStore';

interface FileDropzoneProps {
  onFilesUploaded: (files: File[]) => void;
}

export function FileDropzone({ onFilesUploaded }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const processingState = useProcessingState();

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesUploaded(files);
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  }, [onFilesUploaded]);

  const isProcessing = processingState.status === 'processing';

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept={APP_CONFIG.SUPPORTED_FORMATS.join(',')}
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={isProcessing}
        />
        
        <label 
          htmlFor="file-upload" 
          className={`cursor-pointer ${isProcessing ? 'cursor-not-allowed' : ''}`}
        >
          <div className="space-y-4">
            <div className="text-6xl">
              {isProcessing ? '⏳' : '📁'}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {isProcessing ? 'Processing Files...' : 'Drop files here or click to browse'}
              </h3>
              
              {isProcessing ? (
                <div className="space-y-2">
                  <p className="text-gray-600">{processingState.message}</p>
                  <div className="progress-bar max-w-xs mx-auto">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${processingState.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Upload PNG, JPG, or WebP images of your hand-drawn glyphs
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum {APP_CONFIG.MAX_FILES_PER_UPLOAD} files, 
                    {Math.round(APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB each
                  </p>
                </div>
              )}
            </div>
          </div>
        </label>
      </div>

      {processingState.status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Upload Error</p>
          <p className="text-red-500 text-sm">{processingState.error}</p>
        </div>
      )}

      {processingState.status === 'completed' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">✅ {processingState.message}</p>
        </div>
      )}
    </div>
  );
}
