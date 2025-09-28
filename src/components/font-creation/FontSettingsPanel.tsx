import { useState } from 'react';
import { FontSettings, FontMetadata } from '../../types';

export interface FontSettingsPanelProps {
  settings: FontSettings;
  onSettingsChange: (settings: FontSettings) => void;
  onGenerateFont: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
}

export function FontSettingsPanel({
  settings,
  onSettingsChange,
  onGenerateFont,
  canGenerate,
  isGenerating
}: FontSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'metadata'>('basic');

  const handleMetadataChange = (field: keyof FontMetadata, value: string) => {
    onSettingsChange({
      ...settings,
      metadata: {
        ...settings.metadata,
        [field]: value
      }
    });
  };

  const handleStyleChange = (style: FontSettings['metadata']['style']) => {
    onSettingsChange({
      ...settings,
      metadata: {
        ...settings.metadata,
        style
      }
    });
  };

  const handleWeightChange = (weight: number) => {
    onSettingsChange({
      ...settings,
      metadata: {
        ...settings.metadata,
        weight
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Font Settings
      </h3>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Settings' },
            { id: 'advanced', label: 'Advanced' },
            { id: 'metadata', label: 'Metadata' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Settings Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family Name *
              </label>
              <input
                type="text"
                value={settings.metadata.familyName}
                onChange={(e) => handleMetadataChange('familyName', e.target.value)}
                placeholder="My Custom Font"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be the name of your font family
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'Regular', label: 'Regular' },
                  { value: 'Bold', label: 'Bold' },
                  { value: 'Italic', label: 'Italic' },
                  { value: 'Bold Italic', label: 'Bold Italic' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => handleStyleChange(style.value as any)}
                    className={`px-3 py-2 text-sm font-medium rounded-md border ${
                      settings.metadata.style === style.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Weight
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="100"
                  value={settings.metadata.weight}
                  onChange={(e) => handleWeightChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-gray-600 w-12">
                  {settings.metadata.weight}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Thin</span>
                <span>Normal</span>
                <span>Black</span>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units Per Em
              </label>
              <input
                type="number"
                value={settings.unitsPerEm}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  unitsPerEm: parseInt(e.target.value) || 1000
                })}
                min="100"
                max="2000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Standard OpenType value is 1000. Higher values provide more precision.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ascender
                </label>
                <input
                  type="number"
                  value={settings.metadata.ascender || 800}
                  onChange={(e) => handleMetadataChange('ascender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descender
                </label>
                <input
                  type="number"
                  value={settings.metadata.descender || -200}
                  onChange={(e) => handleMetadataChange('descender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X-Height
                </label>
                <input
                  type="number"
                  value={settings.metadata.xHeight || 500}
                  onChange={(e) => handleMetadataChange('xHeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cap Height
                </label>
                <input
                  type="number"
                  value={settings.metadata.capHeight || 700}
                  onChange={(e) => handleMetadataChange('capHeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                value={settings.metadata.author || ''}
                onChange={(e) => handleMetadataChange('author', e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={settings.metadata.description || ''}
                onChange={(e) => handleMetadataChange('description', e.target.value)}
                placeholder="Describe your font..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License
              </label>
              <select
                value={settings.metadata.license || 'MIT'}
                onChange={(e) => handleMetadataChange('license', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MIT">MIT License</option>
                <option value="Apache-2.0">Apache 2.0</option>
                <option value="GPL-3.0">GPL 3.0</option>
                <option value="CC-BY-4.0">Creative Commons Attribution 4.0</option>
                <option value="CC-BY-SA-4.0">Creative Commons Attribution-ShareAlike 4.0</option>
                <option value="Custom">Custom License</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={settings.metadata.version || '1.0.0'}
                onChange={(e) => handleMetadataChange('version', e.target.value)}
                placeholder="1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Font Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={onGenerateFont}
          disabled={!canGenerate || isGenerating}
          className={`w-full px-4 py-3 text-lg font-medium rounded-lg transition-colors ${
            canGenerate && !isGenerating
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating Font...</span>
            </div>
          ) : (
            'Generate Font'
          )}
        </button>
        
        {!canGenerate && (
          <p className="text-sm text-red-600 mt-2 text-center">
            Please complete all required fields and ensure you have vectorized characters
          </p>
        )}
      </div>
    </div>
  );
}
