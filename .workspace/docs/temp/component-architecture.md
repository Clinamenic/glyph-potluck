# Component Architecture - Glyph Potluck

## Application Structure Overview

The application follows a feature-based architecture with clear separation of concerns between UI components, business logic, and data management.

```
src/
├── components/           # Reusable UI components
├── features/            # Feature-specific components and logic
├── stores/             # Zustand state management
├── services/           # External service integrations
├── utils/              # Helper functions and utilities
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── workers/            # Web Workers for heavy processing
```

## Core Application Components

### App Shell (`src/App.tsx`)

**Responsibilities**:
- Router configuration with hash-based routing
- Global error boundary
- Theme provider and global state initialization
- Wallet connection management

```typescript
function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <WalletProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/create" element={<ProjectWorkspace />} />
              <Route path="/gallery" element={<FontGallery />} />
              <Route path="/project/:id" element={<ProjectLoader />} />
            </Routes>
          </WalletProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}
```

### Landing Page (`src/features/landing/LandingPage.tsx`)

**Purpose**: Entry point with project introduction and navigation
**Key Features**:
- Hero section with value proposition
- Interactive demo/preview
- Sample font showcase
- Call-to-action for starting new project

### Project Workspace (`src/features/workspace/ProjectWorkspace.tsx`)

**Purpose**: Main application interface for font creation
**Layout**: Multi-panel interface with collapsible sections

```typescript
interface WorkspaceLayout {
  sidebar: {
    projectInfo: ProjectMetadata;
    glyphLibrary: GlyphLibraryPanel;
    tools: ToolsPanel;
  };
  mainContent: {
    canvas: VectorizationCanvas;
    preview: FontPreview;
  };
  rightPanel: {
    properties: GlyphProperties;
    fontSettings: FontConfiguration;
  };
}
```

## Feature Components

### 1. Glyph Upload & Management

#### `GlyphUploader` (`src/features/upload/GlyphUploader.tsx`)
**Responsibilities**:
- Drag-and-drop file upload interface
- File validation and preprocessing
- Batch upload support
- Progress tracking

**Props Interface**:
```typescript
interface GlyphUploaderProps {
  onFilesUploaded: (files: ProcessedImageFile[]) => void;
  maxFileSize: number;
  supportedFormats: string[];
  onError: (error: UploadError) => void;
}
```

#### `GlyphLibrary` (`src/features/library/GlyphLibrary.tsx`)
**Responsibilities**:
- Display uploaded and processed glyphs
- Glyph selection and management
- Character assignment interface
- Glyph organization and sorting

### 2. Vectorization Pipeline

#### `VectorizationCanvas` (`src/features/vectorization/VectorizationCanvas.tsx`)
**Responsibilities**:
- Display original image and vectorized result
- Interactive parameter adjustment
- Real-time preview updates
- Zoom and pan functionality

**Key Features**:
```typescript
interface VectorizationState {
  originalImage: ImageData;
  vectorizedPaths: SVGPath[];
  parameters: {
    threshold: number;
    smoothing: number;
    cornerThreshold: number;
  };
  isProcessing: boolean;
}
```

#### `ParameterPanel` (`src/features/vectorization/ParameterPanel.tsx`)
**Responsibilities**:
- Slider controls for vectorization parameters
- Preset parameter combinations
- Live preview toggle
- Reset to defaults functionality

#### `PathEditor` (`src/features/vectorization/PathEditor.tsx`)
**Responsibilities**:
- Interactive SVG path editing
- Bezier curve manipulation
- Point addition/removal
- Path simplification tools

### 3. Font Generation

#### `FontPreview` (`src/features/font/FontPreview.tsx`)
**Responsibilities**:
- Real-time font rendering
- Sample text input
- Size and style adjustments
- Character mapping display

```typescript
interface FontPreviewProps {
  font: CompiledFont | null;
  sampleText: string;
  fontSize: number;
  onTextChange: (text: string) => void;
}
```

#### `FontConfiguration` (`src/features/font/FontConfiguration.tsx`)
**Responsibilities**:
- Font metadata editing (name, family, style)
- Global font metrics (ascender, descender, x-height)
- Kerning pair management
- Export format selection

#### `CharacterMapper` (`src/features/font/CharacterMapper.tsx`)
**Responsibilities**:
- Unicode character assignment
- Visual character grid
- Automatic mapping suggestions
- Custom character range support

### 4. Arweave Integration

#### `WalletConnector` (`src/features/arweave/WalletConnector.tsx`)
**Responsibilities**:
- ArConnect integration
- Wallet balance display
- Connection status management
- Transaction fee estimation

#### `ProjectSaver` (`src/features/arweave/ProjectSaver.tsx`)
**Responsibilities**:
- Project serialization
- Arweave upload progress
- Transaction confirmation
- Error handling and retry logic

#### `FontGallery` (`src/features/gallery/FontGallery.tsx`)
**Responsibilities**:
- Browse community fonts
- Font filtering and search
- Preview and download functionality
- User's font collection

## Shared UI Components

### Layout Components

#### `Layout` (`src/components/layout/Layout.tsx`)
- Application shell with header, sidebar, and main content
- Responsive breakpoints
- Panel collapse/expand functionality

#### `Header` (`src/components/layout/Header.tsx`)
- Application branding and navigation
- User wallet status
- Project save/load controls

#### `Sidebar` (`src/components/layout/Sidebar.tsx`)
- Collapsible panel system
- Tool and feature navigation
- Project information display

### Input Components

#### `FileDropzone` (`src/components/inputs/FileDropzone.tsx`)
- Reusable drag-and-drop file input
- Visual feedback for drag states
- File type validation

#### `ParameterSlider` (`src/components/inputs/ParameterSlider.tsx`)
- Specialized slider for vectorization parameters
- Real-time value display
- Preset value markers

#### `ColorPicker` (`src/components/inputs/ColorPicker.tsx`)
- Color selection for preview and export
- Hex, RGB, and HSL input modes

### Display Components

#### `LoadingSpinner` (`src/components/display/LoadingSpinner.tsx`)
- Consistent loading indicators
- Progress percentage display
- Cancellation support

#### `ErrorMessage` (`src/components/display/ErrorMessage.tsx`)
- Standardized error display
- Retry action buttons
- Error reporting functionality

#### `Toast` (`src/components/display/Toast.tsx`)
- Success/error/info notifications
- Auto-dismiss with custom timing
- Action buttons for contextual actions

## State Management Architecture

### Store Structure (Zustand)

#### `useGlyphStore` (`src/stores/glyphStore.ts`)
```typescript
interface GlyphStore {
  // State
  uploadedImages: ImageFile[];
  processedGlyphs: ProcessedGlyph[];
  selectedGlyph: string | null;
  
  // Actions
  addImages: (files: ImageFile[]) => void;
  processGlyph: (imageId: string, parameters: VectorizationParams) => Promise<void>;
  selectGlyph: (glyphId: string) => void;
  updateGlyphPaths: (glyphId: string, paths: SVGPath[]) => void;
  removeGlyph: (glyphId: string) => void;
}
```

#### `useFontStore` (`src/stores/fontStore.ts`)
```typescript
interface FontStore {
  // State
  fontMetadata: FontMetadata;
  characterMap: Map<string, string>; // glyphId -> unicode
  compiledFont: CompiledFont | null;
  
  // Actions
  updateMetadata: (metadata: Partial<FontMetadata>) => void;
  assignCharacter: (glyphId: string, unicode: string) => void;
  compileFont: () => Promise<CompiledFont>;
  exportFont: (format: FontFormat) => Promise<Blob>;
}
```

#### `useProjectStore` (`src/stores/projectStore.ts`)
```typescript
interface ProjectStore {
  // State
  projectId: string | null;
  projectName: string;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  createProject: (name: string) => void;
  saveProject: () => Promise<string>; // returns Arweave transaction ID
  loadProject: (projectId: string) => Promise<void>;
  markDirty: () => void;
}
```

#### `useArweaveStore` (`src/stores/arweaveStore.ts`)
```typescript
interface ArweaveStore {
  // State
  wallet: ArweaveWallet | null;
  balance: number;
  isConnected: boolean;
  transactions: ArweaveTransaction[];
  
  // Actions
  connectWallet: () => Promise<void>;
  uploadData: (data: any, tags: ArweaveTag[]) => Promise<string>;
  downloadData: (transactionId: string) => Promise<any>;
  getTransactionStatus: (transactionId: string) => Promise<TransactionStatus>;
}
```

## Data Flow Architecture

### 1. Image Upload Flow
```
User selects files → FileDropzone → Validation → 
Store in glyphStore → Trigger preprocessing → 
Display in GlyphLibrary
```

### 2. Vectorization Flow
```
User selects glyph → VectorizationCanvas loads image → 
User adjusts parameters → Web Worker processes → 
Results stored in glyphStore → Canvas updates display
```

### 3. Font Compilation Flow
```
User configures font → FontConfiguration updates fontStore → 
User triggers compilation → Web Worker processes → 
Compiled font stored → FontPreview updates
```

### 4. Project Save Flow
```
User saves project → ProjectStore serializes data → 
ArweaveStore uploads to network → Transaction ID returned → 
Project marked as saved
```

## Web Worker Architecture

### `VectorizationWorker` (`src/workers/vectorization.worker.ts`)
**Purpose**: Handle CPU-intensive Potrace processing
**Interface**:
```typescript
interface VectorizationMessage {
  type: 'VECTORIZE' | 'CANCEL';
  payload: {
    imageData: ImageData;
    parameters: VectorizationParams;
  };
}

interface VectorizationResponse {
  type: 'PROGRESS' | 'COMPLETE' | 'ERROR';
  payload: {
    progress?: number;
    paths?: SVGPath[];
    error?: string;
  };
}
```

### `FontGenerationWorker` (`src/workers/fontGeneration.worker.ts`)
**Purpose**: Handle font compilation using opentype.js
**Features**:
- Font metrics calculation
- Glyph assembly and optimization
- Multiple format generation

## Component Communication Patterns

### Parent-Child Props
- Direct data passing for simple, hierarchical relationships
- Callback functions for upward event propagation

### Zustand Stores
- Global state for cross-feature data sharing
- Subscribe to specific state slices for performance

### Context Providers
- Theme and configuration data
- Wallet connection state
- Error boundary handling

### Custom Hooks
- Encapsulate complex state logic
- Share common functionality between components
- Handle side effects and lifecycle management

## Performance Optimizations

### Component Level
- `React.memo` for expensive render components
- `useMemo` and `useCallback` for expensive calculations
- Code splitting with `React.lazy` for large features

### State Management
- Granular store subscriptions to minimize re-renders
- Computed values using Zustand's selector pattern
- Debounced updates for parameter changes

### Asset Management
- Lazy loading of heavy libraries (Potrace, opentype.js)
- Image optimization before processing
- Progressive loading for gallery components

---

*This architecture provides a scalable foundation while maintaining clear separation of concerns and optimal performance for browser-based font generation.*
