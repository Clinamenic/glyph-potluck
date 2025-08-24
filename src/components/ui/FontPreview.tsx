import { useState } from 'react';
import { useProcessedGlyphs } from '@/stores/useGlyphStore';

export function FontPreview() {
  const processedGlyphs = useProcessedGlyphs();
  const [previewText, setPreviewText] = useState('HELLO WORLD');
  const [fontSize, setFontSize] = useState(48);

  if (processedGlyphs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔤</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No glyphs processed yet
        </h3>
        <p className="text-gray-500">
          Upload and process some images to see your font preview
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Preview Text
          </label>
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type text to preview..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Font Size: {fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="120"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Font preview area */}
      <div className="bg-white border rounded-lg p-6 min-h-[200px] flex items-center justify-center">
        <div 
          className="text-center break-all"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: 1.2,
            fontFamily: 'monospace', // Will be replaced with generated font
            color: '#333'
          }}
        >
          {previewText || 'Type something above...'}
        </div>
      </div>

      {/* Processed glyphs */}
      <div>
        <h3 className="font-semibold mb-4">
          Processed Glyphs ({processedGlyphs.length})
        </h3>
        <div className="grid grid-cols-6 gap-3">
          {processedGlyphs.map((glyph) => (
            <div
              key={glyph.id}
              className="aspect-square bg-white border rounded-lg p-2 flex items-center justify-center"
            >
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                fill="currentColor"
              >
                {glyph.svgPaths.map((path, index) => (
                  <path key={index} d={path} />
                ))}
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Character mapping section */}
      <div>
        <h3 className="font-semibold mb-4">Character Mapping</h3>
        <div className="space-y-2">
          {processedGlyphs.map((glyph) => (
            <div
              key={glyph.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 bg-white border rounded flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-6 h-6" fill="currentColor">
                  {glyph.svgPaths.map((path, index) => (
                    <path key={index} d={path} />
                  ))}
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm text-gray-600">
                  {glyph.originalFile.name}
                </span>
              </div>
              <input
                type="text"
                placeholder="A"
                maxLength={1}
                value={glyph.character || ''}
                onChange={(e) => {
                  // This would update the character mapping
                  console.log('Character mapping:', glyph.id, e.target.value);
                }}
                className="w-12 px-2 py-1 text-center border border-gray-300 rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Download section */}
      {processedGlyphs.length > 0 && (
        <div className="pt-6 border-t">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Font Name
              </label>
              <input
                type="text"
                placeholder="My Custom Font"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button className="btn btn-success btn-lg w-full">
              📥 Generate & Download Font
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
