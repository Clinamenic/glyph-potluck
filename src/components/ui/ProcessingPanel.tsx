import { useState } from 'react';
import { useGlyphStore, useUploadedFiles, useProcessingState } from '@/stores/useGlyphStore';
import type { VectorizationQuality } from '@/types';

export function ProcessingPanel() {
  const { processGlyph } = useGlyphStore();
  const uploadedFiles = useUploadedFiles();
  const processingState = useProcessingState();
  const [selectedQuality, setSelectedQuality] = useState<VectorizationQuality>('balanced');

  const handleProcessAll = async () => {
    for (const file of uploadedFiles) {
      await processGlyph(file.id, { quality: selectedQuality });
    }
  };

  const qualityOptions = [
    {
      value: 'fast' as const,
      label: 'Fast',
      description: 'Quick processing, good for simple shapes',
      time: '~1-3 seconds'
    },
    {
      value: 'balanced' as const,
      label: 'Balanced',
      description: 'Good quality with reasonable speed',
      time: '~3-8 seconds'
    },
    {
      value: 'high' as const,
      label: 'High Quality',
      description: 'Best results for detailed drawings',
      time: '~5-15 seconds'
    }
  ];

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Process Your Glyphs</h2>
      
      {/* Quality selection */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Choose Processing Quality</h3>
        <div className="space-y-3">
          {qualityOptions.map((option) => (
            <label
              key={option.value}
              className={`
                block p-4 border-2 rounded-lg cursor-pointer transition-all
                ${selectedQuality === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="quality"
                value={option.value}
                checked={selectedQuality === option.value}
                onChange={(e) => setSelectedQuality(e.target.value as VectorizationQuality)}
                className="sr-only"
              />
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
                <div className="text-sm text-gray-500 ml-4">
                  {option.time}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Processing button */}
      <div className="space-y-4">
        <button
          onClick={handleProcessAll}
          disabled={processingState.status === 'processing' || uploadedFiles.length === 0}
          className="btn btn-primary btn-lg w-full"
        >
          {processingState.status === 'processing' ? (
            <div className="flex items-center gap-3">
              <div className="loading-spinner" />
              Processing...
            </div>
          ) : (
            `Convert ${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'Image' : 'Images'} to Vectors`
          )}
        </button>

        {processingState.status === 'processing' && (
          <div className="space-y-2">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${processingState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {processingState.message}
            </p>
          </div>
        )}

        {processingState.status === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">Processing Error</p>
            <p className="text-red-500 text-sm">{processingState.error}</p>
          </div>
        )}

        {processingState.status === 'completed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium">✅ {processingState.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
