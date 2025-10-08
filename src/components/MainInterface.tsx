// Main application interface
import React, { useEffect, useCallback } from 'react';
import { FontCreationInterface } from './font-creation/FontCreationInterface';
import { validateImageTracer } from '@/utils/imagetracerVectorization';
import { InfoButton } from './ui/InfoButton';
import { QuickTipsModal } from './ui/QuickTipsModal';
import { ExportInfoModal } from './ui/ExportInfoModal';
import { useModal } from '../hooks/useModal';

export function MainInterface() {
  const quickTipsModal = useModal();
  const exportInfoModal = useModal();
  const characterSetInfoModal = useModal();
  const [exportState, setExportState] = React.useState<{
    compiledFont: any;
    exportFormat: 'ttf' | 'otf';
    includeMetadata: boolean;
  }>({
    compiledFont: null,
    exportFormat: 'ttf',
    includeMetadata: true
  });

  const handleCompiledFontChange = useCallback((compiledFont: any) => {
    setExportState(prev => ({ ...prev, compiledFont }));
  }, []);

  const handleExportSettingsChange = useCallback((settings: { exportFormat: 'ttf' | 'otf'; includeMetadata: boolean }) => {
    setExportState(prev => ({ ...prev, ...settings }));
  }, []);

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
    <div className="app-container">
      {/* Information Button */}
      <InfoButton onClick={quickTipsModal.open} />

      {/* Header */}
      <header className="header">
        <h1 className="header-title">
          <span className="header-title-glyph">Glyph</span>
          <span className="header-title-potluck">Potluck</span>
        </h1>
      </header>

      {/* Interface Content */}
      <FontCreationInterface
        exportInfoModal={exportInfoModal}
        characterSetInfoModal={characterSetInfoModal}
        onCompiledFontChange={handleCompiledFontChange}
        onExportSettingsChange={handleExportSettingsChange}
      />

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          Powered by Arweave • Version {__APP_VERSION__}
        </p>
      </footer>

      {/* Quick Tips Modal */}
      <QuickTipsModal
        isOpen={quickTipsModal.isOpen}
        onClose={quickTipsModal.close}
      />

      {/* Export Info Modal */}
      <ExportInfoModal
        isOpen={exportInfoModal.isOpen}
        onClose={exportInfoModal.close}
        compiledFont={exportState.compiledFont}
        exportFormat={exportState.exportFormat}
        includeMetadata={exportState.includeMetadata}
      />
    </div>
  );
}
