import { FontSettings, FontMetadata } from '../../types';

export interface FontSettingsPanelProps {
  settings: FontSettings;
  onSettingsChange: (settings: FontSettings) => void;
  onGenerateFont: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  validationMessage?: string;
}

export function FontSettingsPanel({
  settings,
  onSettingsChange,
  onGenerateFont,
  canGenerate,
  isGenerating,
  validationMessage
}: FontSettingsPanelProps) {

  const handleMetadataChange = (field: keyof FontMetadata, value: string) => {
    onSettingsChange({
      ...settings,
      metadata: {
        ...settings.metadata,
        [field]: value
      }
    });
  };


  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-heading">
          Font Settings
        </h3>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Font Family Name */}
        <div className="form-field">
          <label className="form-field-label">
            Font Family Name *
          </label>
          <input
            type="text"
            value={settings.metadata.familyName}
            onChange={(e) => handleMetadataChange('familyName', e.target.value)}
            placeholder="My Custom Font"
            className="form-field-input"
            required
          />
          <p className="form-field-help">
            This will be the name of your font family
          </p>
        </div>

        {/* Author */}
        <div className="form-field">
          <label className="form-field-label">
            Author
          </label>
          <input
            type="text"
            value={settings.metadata.author || ''}
            onChange={(e) => handleMetadataChange('author', e.target.value)}
            placeholder="Your Name"
            className="form-field-input"
          />
        </div>

        {/* Description */}
        <div className="form-field">
          <label className="form-field-label">
            Description
          </label>
          <textarea
            value={settings.metadata.description || ''}
            onChange={(e) => handleMetadataChange('description', e.target.value)}
            placeholder="Describe your font..."
            rows={3}
            className="form-field-input"
          />
        </div>

        {/* License */}
        <div className="form-field">
          <label className="form-field-label">
            License
          </label>
          <select
            value={settings.metadata.license || 'MIT'}
            onChange={(e) => handleMetadataChange('license', e.target.value)}
            className="form-field-input"
          >
            <option value="MIT">MIT License</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="CC-BY-4.0">Creative Commons Attribution 4.0</option>
            <option value="CC-BY-SA-4.0">Creative Commons Attribution-ShareAlike 4.0</option>
            <option value="Custom">Custom License</option>
          </select>
        </div>

        {/* Version */}
        <div className="form-field">
          <label className="form-field-label">
            Version
          </label>
          <input
            type="text"
            value={settings.metadata.version || '1.0.0'}
            onChange={(e) => handleMetadataChange('version', e.target.value)}
            placeholder="1.0.0"
            className="form-field-input"
          />
        </div>
      </div>

      {/* Card Footer with Generate Action */}
      <div className="card-footer card-footer--center">
        <div className="card-footer-actions">
          <button
            onClick={onGenerateFont}
            disabled={!canGenerate || isGenerating}
            className={`btn btn-primary btn-lg ${(!canGenerate || isGenerating) ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="loading-spinner"></div>
                <span>Generating Font...</span>
              </div>
            ) : (
              'Generate Font'
            )}
          </button>
        </div>

        {validationMessage && (
          <div className="card-footer-meta">
            <span className="text-red-500">{validationMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
