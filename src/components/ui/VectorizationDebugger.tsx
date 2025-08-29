import { useState, useEffect } from 'react';
import { useProcessedGlyphs } from '@/stores/useGlyphStore';

// Helper function to render bitmap to canvas
function renderBitmapToCanvas(bitmap: number[][], canvas: HTMLCanvasElement) {
  const height = bitmap.length;
  const width = bitmap[0]?.length || 0;
  
  if (width === 0 || height === 0) return;
  
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100px';
  canvas.style.height = '100px';
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const imageData = ctx.createImageData(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const value = bitmap[y][x] === 1 ? 0 : 255; // 1 = black (foreground), 0 = white (background)
      
      imageData.data[i] = value;     // R
      imageData.data[i + 1] = value; // G  
      imageData.data[i + 2] = value; // B
      imageData.data[i + 3] = 255;   // A
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

export function VectorizationDebugger() {
  const processedGlyphs = useProcessedGlyphs();
  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  if (!showDebugInfo) {
    return (
      <div className="card-glass">
        <button
          onClick={() => setShowDebugInfo(true)}
          className="text-white/80 hover:text-white text-sm"
        >
          Show Vectorization Debug Info
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Vectorization Debugger</h3>
        <button
          onClick={() => setShowDebugInfo(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {processedGlyphs.length === 0 ? (
        <p className="text-gray-500">No processed glyphs to debug</p>
      ) : (
        <div className="space-y-4">
          {/* Glyph selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Glyph to Debug
            </label>
            <select
              value={selectedGlyph || ''}
              onChange={(e) => setSelectedGlyph(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a glyph...</option>
              {processedGlyphs.map((glyph) => (
                <option key={glyph.id} value={glyph.id}>
                  {glyph.originalFile.name}
                </option>
              ))}
            </select>
          </div>

          {/* Debug info for selected glyph */}
          {selectedGlyph && (() => {
            const glyph = processedGlyphs.find(g => g.id === selectedGlyph);
            if (!glyph) return null;

            // Render bitmap visualization
            useEffect(() => {
              const bitmap = (globalThis as any).lastProcessedBitmap;
              if (bitmap) {
                const canvas = document.getElementById(`bitmap-canvas-${glyph.id}`) as HTMLCanvasElement;
                if (canvas) {
                  renderBitmapToCanvas(bitmap, canvas);
                }
              }
            }, [glyph.id]);

            return (
              <div className="space-y-4">
                {/* Basic info */}
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>File:</strong> {glyph.originalFile.name}</p>
                    <p><strong>Size:</strong> {(glyph.originalFile.size / 1024).toFixed(1)} KB</p>
                    <p><strong>Type:</strong> {glyph.originalFile.type}</p>
                    <p><strong>Quality:</strong> {glyph.processingParams.quality}</p>
                    <p><strong>Processed:</strong> {glyph.processed.toLocaleString()}</p>
                  </div>
                </div>

                {/* SVG paths */}
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2">SVG Paths ({glyph.svgPaths.length})</h4>
                  {glyph.svgPaths.map((path, index) => (
                    <div key={index} className="mb-2">
                      <p className="text-sm font-medium">Path {index + 1}:</p>
                      <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                        {path}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vector data */}
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2">Vector Data</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Commands:</strong> {glyph.vectorData.paths.length}</p>
                    <p><strong>Bounds:</strong> {glyph.vectorData.bounds.width.toFixed(1)} × {glyph.vectorData.bounds.height.toFixed(1)}</p>
                    <p><strong>Position:</strong> ({glyph.vectorData.bounds.x.toFixed(1)}, {glyph.vectorData.bounds.y.toFixed(1)})</p>
                  </div>
                </div>

                {/* Visual comparison */}
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2">Visual Comparison</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Original image */}
                    <div>
                      <p className="text-sm font-medium mb-2">Original Image</p>
                      <div className="bg-white border rounded p-2">
                        <img 
                          src={glyph.originalFile.dataUrl} 
                          alt="Original" 
                          className="w-full h-24 object-contain"
                        />
                      </div>
                    </div>

                    {/* Binary bitmap visualization */}
                    <div>
                      <p className="text-sm font-medium mb-2">Processed Bitmap</p>
                      <div className="bg-white border rounded p-2 h-28 flex items-center justify-center">
                        <canvas 
                          id={`bitmap-canvas-${glyph.id}`}
                          className="max-w-full max-h-full border"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    </div>

                    {/* Vectorized result */}
                    <div>
                      <p className="text-sm font-medium mb-2">Vectorized Result</p>
                      <div className="bg-white border rounded p-2 h-28 flex items-center justify-center">
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
                    </div>
                  </div>
                </div>

                {/* Path commands breakdown */}
                {glyph.vectorData.paths.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Path Commands</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {glyph.vectorData.paths.map((cmd, index) => (
                        <div key={index} className="text-xs font-mono">
                          <span className="font-medium">{cmd.command}</span>{' '}
                          {cmd.values.map(v => v.toFixed(1)).join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
