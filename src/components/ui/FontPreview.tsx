import { useState } from 'react';
import { useProcessedGlyphs, useGlyphStore } from '@/stores/useGlyphStore';
import { InteractiveSVGEditor } from './InteractiveSVGEditor';

export function FontPreview() {
  const processedGlyphs = useProcessedGlyphs();
  const [editingMode, setEditingMode] = useState(false);
  const [selectedGlyphId, setSelectedGlyphId] = useState<string | null>(null);
  
  const store = useGlyphStore();

  if (processedGlyphs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">Aa</div>
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
      {/* Processed glyphs with editing controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Processed Glyphs ({processedGlyphs.length})
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingMode(!editingMode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editingMode
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {editingMode ? "Preview Mode" : "Edit Mode"}
            </button>
            
            {editingMode && selectedGlyphId && (
              <div className="flex gap-1">
                <button
                  onClick={() => store.undoPathEdit(selectedGlyphId)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  title="Undo"
                >
                  Undo
                </button>
                <button
                  onClick={() => store.redoPathEdit(selectedGlyphId)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  title="Redo"
                >
                  Redo
                </button>
                <button
                  onClick={() => store.resetGlyphToOriginal(selectedGlyphId)}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                  title="Reset to original"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {processedGlyphs.map((glyph) => (
            <div 
              key={glyph.id} 
              className={`space-y-2 ${editingMode && selectedGlyphId === glyph.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
            >
              {/* Selection control for editing mode */}
              {editingMode && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedGlyphId(glyph.id === selectedGlyphId ? null : glyph.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedGlyphId === glyph.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {selectedGlyphId === glyph.id ? "Editing" : "Select"}
                  </button>
                </div>
              )}
              
              <div className="aspect-square bg-white border rounded-lg overflow-hidden">
                {editingMode && selectedGlyphId === glyph.id ? (
                  <InteractiveSVGEditor
                    glyphId={glyph.id}
                    initialPath={glyph.svgPaths[0] || ""}
                    onPathChanged={(newPath) => {
                      store.updateGlyphPath(glyph.id, newPath);
                    }}
                    viewBox={{ width: 200, height: 200 }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="p-2 flex items-center justify-center h-full">
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
                )}
              </div>
              
              {/* File info */}
              <div className="text-xs text-gray-500 text-center">
                {glyph.originalFile.name}
                {editingMode && selectedGlyphId === glyph.id && (
                  <div className="text-blue-600 font-medium mt-1">
                    Click and drag nodes to edit
                  </div>
                )}
              </div>
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
                  const { updateGlyphCharacter } = useGlyphStore.getState();
                  updateGlyphCharacter(glyph.id, e.target.value);
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
              Generate & Download Font
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
