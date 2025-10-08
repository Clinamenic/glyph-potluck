import { useState } from 'react';
import { useGlyphStore, useUploadedFiles, useProcessingState } from '@/stores/useGlyphStore';
import type { VectorizationQuality } from '@/types';

export function ProcessingPanel() {
  const { processGlyph } = useGlyphStore();
  const uploadedFiles = useUploadedFiles();
  const processingState = useProcessingState();
  const [selectedQuality, setSelectedQuality] = useState<VectorizationQuality>('high');

  const handleProcessAll = async () => {
    console.log('🚀 Starting batch processing...', { 
      fileCount: uploadedFiles.length, 
      quality: selectedQuality 
    });
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      console.log(`📤 Processing file ${i + 1}/${uploadedFiles.length}: ${file.name}`);
      try {
        await processGlyph(file.id, { quality: selectedQuality });
        console.log(`✅ Completed processing: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error);
      }
    }
    console.log('🎉 Batch processing completed!');
  };

  const qualityOptions = [
    {
      value: 'high' as const,
      label: 'High Quality',
      description: 'Professional vectorization with smooth curves',
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

      {/* Card Footer with Processing Actions and Status */}
      <div className="card-footer card-footer--center">
        <div className="card-footer-actions">
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
        </div>

        {/* Processing Status */}
        {processingState.status === 'processing' && (
          <div className="card-footer-meta">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${processingState.progress}%` }}
              />
            </div>
            <span className="text-blue-600">{processingState.message}</span>
          </div>
        )}

        {processingState.status === 'error' && (
          <div className="card-footer-meta">
            <span className="text-red-600">❌ Processing Error: {processingState.error}</span>
          </div>
        )}

        {processingState.status === 'completed' && (
          <div className="card-footer-meta">
            <span className="text-green-600">✅ {processingState.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
