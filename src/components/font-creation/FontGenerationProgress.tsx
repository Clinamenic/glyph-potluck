
import { FontGenerationProgress as ProgressType } from '../../services/font-generation';

export interface FontGenerationProgressProps {
  progress: ProgressType | null;
  isVisible: boolean;
}

export function FontGenerationProgress({
  progress,
  isVisible
}: FontGenerationProgressProps) {
  if (!isVisible || !progress) {
    return null;
  }

  const getStageIcon = (stage: ProgressType['stage']) => {
    switch (stage) {
      case 'preparing':
        return '🔧';
      case 'converting':
        return '🔄';
      case 'calculating':
        return '📊';
      case 'building':
        return '🏗️';
      case 'compiling':
        return '⚙️';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getStageDescription = (stage: ProgressType['stage']) => {
    switch (stage) {
      case 'preparing':
        return 'Preparing font generation...';
      case 'converting':
        return 'Converting SVG paths to glyphs...';
      case 'calculating':
        return 'Calculating font metrics...';
      case 'building':
        return 'Building OpenType font...';
      case 'compiling':
        return 'Compiling font formats...';
      case 'complete':
        return 'Font generation complete!';
      default:
        return 'Processing...';
    }
  };

  const getProgressColor = (stage: ProgressType['stage']) => {
    if (stage === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Progress Icon */}
          <div className="text-4xl mb-4">
            {getStageIcon(progress.stage)}
          </div>

          {/* Stage Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getStageDescription(progress.stage)}
          </h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(progress.stage)}`}
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>

          {/* Progress Percentage */}
          <div className="text-2xl font-bold text-gray-900 mb-4">
            {progress.progress}%
          </div>

          {/* Current Operation */}
          <div className="text-sm text-gray-600 mb-4">
            {progress.message}
          </div>

          {/* Glyph Progress (if available) */}
          {progress.currentGlyph && progress.totalGlyphs && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-500 mb-1">Processing Glyphs</div>
              <div className="text-sm font-medium text-gray-900">
                {progress.currentGlyph} ({progress.totalGlyphs} total)
              </div>
            </div>
          )}

          {/* Stage Indicators */}
          <div className="flex justify-between text-xs text-gray-500">
            {[
              { stage: 'preparing', label: 'Prep' },
              { stage: 'converting', label: 'Convert' },
              { stage: 'calculating', label: 'Metrics' },
              { stage: 'building', label: 'Build' },
              { stage: 'compiling', label: 'Compile' }
            ].map(({ stage, label }) => (
              <div
                key={stage}
                className={`flex-1 text-center ${
                  progress.stage === stage
                    ? 'text-blue-600 font-medium'
                    : progress.stage === 'complete' || 
                      ['preparing', 'converting', 'calculating', 'building', 'compiling'].indexOf(progress.stage) > 
                      ['preparing', 'converting', 'calculating', 'building', 'compiling'].indexOf(stage)
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Completion Message */}
          {progress.stage === 'complete' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800 text-sm">
                🎉 Your font has been generated successfully!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
