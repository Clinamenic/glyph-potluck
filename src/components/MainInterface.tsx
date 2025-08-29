// Main application interface
import { useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { FileList } from '@/components/ui/FileList';
import { ProcessingPanel } from '@/components/ui/ProcessingPanel';
import { FontPreview } from '@/components/ui/FontPreview';
import { VectorizationDebugger } from '@/components/ui/VectorizationDebugger';
import { useGlyphStore, useUploadedFiles } from '@/stores/useGlyphStore';
import { validateImageTracer } from '@/utils/imagetracerVectorization';

export function MainInterface() {
  const { addFiles, removeFile } = useGlyphStore();
  const uploadedFiles = useUploadedFiles();

  // Test ImageTracer on startup
  useEffect(() => {
    const testImageTracer = async () => {
      try {
        const isValid = await validateImageTracer();
        console.log('🧪 ImageTracer validation result:', isValid ? 'PASSED' : 'FAILED');
      } catch (error) {
        console.error('🧪 ImageTracer validation error:', error);
      }
    };
    
    testImageTracer();
  }, []);

  const handleFilesUploaded = async (files: File[]) => {
    await addFiles(files);
  };

  const handleFileRemove = (fileId: string) => {
    removeFile(fileId);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="text-center py-8 mb-8">
        <h1 className="text-5xl font-bold text-white mb-4">
          Glyph Potluck
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Turn your hand-drawn letters into beautiful fonts. Upload images, 
          choose quality, and download your custom font in seconds.
        </p>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left side - Upload and processing */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Upload Your Drawings</h2>
              <FileDropzone onFilesUploaded={handleFilesUploaded} />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <FileList 
                    files={uploadedFiles} 
                    onRemove={handleFileRemove}
                  />
                </div>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <ProcessingPanel />
            )}
          </div>

          {/* Right side - Preview and download */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Font Preview</h2>
              <FontPreview />
            </div>

            {/* Quick tips */}
            <div className="card-glass">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Tips
              </h3>
              <ul className="space-y-2 text-white/90 text-sm">
                <li>• Use dark ink on white paper for best results</li>
                <li>• Keep drawings large and clear</li>
                <li>• Each image should contain one character</li>
                <li>• High contrast = better vectorization</li>
              </ul>
            </div>

            {/* Vectorization debugger */}
            <VectorizationDebugger />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 mt-16">
        <p className="text-white/60">
          Powered by Arweave • Version {__APP_VERSION__}
        </p>
      </footer>
    </div>
  );
}
