// Main application interface
import { useEffect } from 'react';
import { FontCreationInterface } from './font-creation/FontCreationInterface';
import { validateImageTracer } from '@/utils/imagetracerVectorization';

export function MainInterface() {
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

      {/* Interface Content */}
      <FontCreationInterface />

      {/* Footer */}
      <footer className="text-center py-8 mt-16">
        <p className="text-white/60">
          Powered by Arweave • Version {__APP_VERSION__}
        </p>
      </footer>
    </div>
  );
}
