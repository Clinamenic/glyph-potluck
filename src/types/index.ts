// Glyph Potluck - TypeScript Type Definitions

// Application state types
export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type VectorizationQuality = 'fast' | 'balanced' | 'high';

export interface VectorizationParams {
  quality: VectorizationQuality;
  threshold?: number;
  smoothing?: number;
  cornerThreshold?: number;
}

// File and image types
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploaded: Date;
}

export interface ProcessedGlyph {
  id: string;
  originalFile: UploadedFile;
  svgPaths: string[];
  vectorData: {
    paths: SVGPathCommand[];
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  processingParams: VectorizationParams;
  character?: string; // Unicode character assignment
  processed: Date;

  methodId?: string;    // Unique identifier for vectorization method
  editablePathData?: EditablePathData; // Interactive editing data
  editHistory?: EditablePathData[]; // Undo/redo history
  currentEditIndex?: number; // Current position in edit history
}

// SVG and vector types
export interface SVGPathCommand {
  command: string;
  values: number[];
}

// SVG Path editing types for interactive editing
export interface SVGPathNode {
  id: string;
  type: "move" | "line" | "curve" | "close";
  x: number;
  y: number;
  controlPoint1?: { x: number; y: number };
  controlPoint2?: { x: number; y: number };
}

export interface EditablePathData {
  nodes: SVGPathNode[];
  viewBox: { width: number; height: number; x: number; y: number };
  originalPath: string;
}

export interface PathEditingState {
  selectedNodeId: string | null;
  dragState: {
    isDragging: boolean;
    startPosition: { x: number; y: number };
    nodeId: string | null;
  };
  hoveredNodeId: string | null;
  editMode: "select" | "add" | "delete" | "move-path";
  // Path-level selection for positioning
  selectedPathId?: string | null;
  isPathDragging?: boolean;
  isPathHovered?: boolean;
}

export interface GlyphMetrics {
  leftSideBearing: number;
  rightSideBearing: number;
  advanceWidth: number;
  ascender?: number;
  descender?: number;
}

export interface PositioningState {
  showMetricGuides: boolean;
  snapToMetrics: boolean;
  metricSnapThreshold: number;
  pathOffset: { x: number; y: number };
  selectedMetricLine?: 'baseline' | 'x-height' | 'cap-height' | 'ascender' | 'descender';
}

// Font generation types
export interface FontMetadata {
  familyName: string;
  style: 'Regular' | 'Bold' | 'Italic' | 'Bold Italic';
  weight: number;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  // Advanced font metrics
  ascender?: number;
  descender?: number;
  xHeight?: number;
  capHeight?: number;
}

export interface FontSettings {
  metadata: FontMetadata;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  xHeight: number;
  capHeight: number;
}

export interface CompiledFont {
  fontData: ArrayBuffer;
  format: 'ttf' | 'otf' | 'woff' | 'woff2';
  size: number;
  checksum: string;
  glyphCount: number;
  generatedAt: Date;
}

// Character mapping types
export interface CharacterMapping {
  glyphId: string;
  unicode: string;
  character: string;
  name?: string;
}

// Processing status types
export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number; // 0-100
  message?: string;
  error?: string;
}

// UI state types
export interface AppState {
  currentStep: WizardStep;
  canProceed: boolean;
  canGoBack: boolean;
}

export interface UIState {
  theme: 'light' | 'dark';
  showAdvancedOptions: boolean;
  selectedGlyphId?: string;
  previewText: string;
  fontSize: number;
}

// Store interfaces for Zustand
export interface GlyphStore {
  // State
  uploadedFiles: UploadedFile[];
  processedGlyphs: ProcessedGlyph[];
  processingState: ProcessingState;
  selectedQuality: VectorizationQuality;
  
  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  processGlyph: (fileId: string, params: VectorizationParams) => Promise<void>;
  updateGlyphCharacter: (glyphId: string, character: string) => void;
  clearAll: () => void;

  // New editing actions
  updateGlyphPath: (glyphId: string, newPath: string) => void;
  setEditablePathData: (glyphId: string, pathData: EditablePathData) => void;
  addPathEditToHistory: (glyphId: string, pathData: EditablePathData) => void;
  undoPathEdit: (glyphId: string) => void;
  redoPathEdit: (glyphId: string) => void;
  resetGlyphToOriginal: (glyphId: string) => void;
}

export interface FontStore {
  // State
  fontSettings: FontSettings;
  characterMappings: CharacterMapping[];
  compiledFont: CompiledFont | null;
  generationState: ProcessingState;
  
  // Actions
  updateFontSettings: (settings: Partial<FontSettings>) => void;
  setCharacterMapping: (glyphId: string, unicode: string) => void;
  generateFont: () => Promise<CompiledFont>;
  downloadFont: (format: 'ttf' | 'otf') => void;
  clearFont: () => void;
}

export interface AppStore {
  // State
  appState: AppState;
  uiState: UIState;
  
  // Actions
  setCurrentStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateUIState: (updates: Partial<UIState>) => void;
  resetApp: () => void;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export type ErrorType = 
  | 'FILE_UPLOAD_ERROR'
  | 'VECTORIZATION_ERROR'
  | 'FONT_GENERATION_ERROR'
  | 'BROWSER_COMPATIBILITY_ERROR'
  | 'UNKNOWN_ERROR';

// Browser feature detection
export interface BrowserCapabilities {
  fileAPI: boolean;
  canvasAPI: boolean;
  webWorkers: boolean;
  localStorage: boolean;
  webGL: boolean;
}

// Event types for components
export interface StepChangeEvent {
  from: WizardStep;
  to: WizardStep;
  canProceed: boolean;
}

export interface FileUploadEvent {
  files: File[];
  totalSize: number;
  validFiles: File[];
  invalidFiles: { file: File; reason: string }[];
}

export interface VectorizationCompleteEvent {
  glyphId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// Global app constants
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] as const,
  MAX_FILES_PER_UPLOAD: 50,
  MIN_IMAGE_SIZE: 32, // 32x32 pixels
  MAX_IMAGE_SIZE: 4096, // 4096x4096 pixels
  DEFAULT_FONT_SIZE: 48,
  PREVIEW_TEXT: 'The quick brown fox jumps over the lazy dog 1234567890',
} as const;

// Utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for picking specific properties
export type PickBy<T, K extends keyof T> = Pick<T, K>;

// Environment and build info types are now in vite-env.d.ts
