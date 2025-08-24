# Glyph Potluck - Preliminary Architecture

## Project Overview

**Glyph Potluck** is a simple, single-page web application deployed on Arweave that enables non-technical users to convert hand-drawn font glyphs into vector graphics and compile them into usable fonts. The application operates entirely client-side with no data storage requirements.

### Core Functionality
- Upload and preview hand-drawn glyph images/scans
- Convert bitmap images to vector graphics with multiple quality/method options
- Simple, intuitive interface designed for non-technical users
- Compile vectorized glyphs into downloadable font files (TTF/OTF)
- All processing happens locally in the browser - no data leaves the user's device

## Technical Architecture

### 1. Frontend Framework & Routing

**Framework**: React 18+ with TypeScript
- **Rationale**: Mature ecosystem, excellent TypeScript support, large community
- **Alternative considered**: Svelte (smaller bundle size, simpler state management)

**Routing**: Simple single-page application (no routing needed)
- **Approach**: Single page with step-by-step wizard interface
- **Navigation**: Tab/step-based navigation within the page

**Build Tool**: Vite
- **Benefits**: Fast development server, optimized production builds, excellent ES module support
- **Arweave compatibility**: Generates static assets with relative paths

### 2. Core Application Modules

#### 2.1 Image Processing & Vectorization
**Multiple Vectorization Options**:

**Option 1: High Quality (Potrace.js)**
- WebAssembly-based professional vectorization
- Best for detailed, artistic glyphs
- Slower processing but superior results

**Option 2: Fast/Simple (Canvas API + Custom)**
- JavaScript-based edge detection and path tracing
- Best for simple, clean drawings
- Faster processing for quick results

**Option 3: Balanced (Optimized Potrace)**
- Potrace with simplified parameters
- Good quality with reasonable speed
- Recommended default for most users

**Processing Pipeline**:
1. Image preprocessing (auto-crop, contrast enhancement)
2. User selects vectorization method/quality
3. Vectorization with progress feedback
4. Automatic path optimization and cleanup

#### 2.2 Font Generation
**Primary Library**: opentype.js
- **Capabilities**: Create TTF/OTF files from vector paths
- **Features**: Glyph metrics, kerning tables, font metadata
- **Output formats**: TTF (recommended), OTF, WOFF/WOFF2

**Glyph Management**:
- Unicode character mapping
- Glyph metrics (ascender, descender, x-height)
- Kerning pair definitions
- Font metadata (family name, style, weight)

#### 2.3 User Interface Components

**Simple Wizard Interface**:
- `Step1_Upload`: Drag-and-drop image upload with instant preview
- `Step2_Vectorize`: Choose quality option and process with progress bar
- `Step3_Refine`: Simple preview and basic adjustments (optional)
- `Step4_Font`: Add character mapping and font name
- `Step5_Download`: Download TTF/OTF file

**Design Principles**:
- Minimal, wizard-style interface with clear next steps
- Large, touch-friendly buttons and controls
- Visual progress indicator throughout the process
- No technical jargon - plain language explanations
- Mobile-friendly responsive design

### 3. State Management

**Solution**: Zustand with TypeScript
- **Rationale**: Simpler than Redux, better TypeScript integration than Context API
- **Architecture**: Feature-based stores with cross-store subscriptions

**Store Structure**:
```typescript
// Simple application stores
- glyphStore: uploaded images, vectorization results, current glyph data
- fontStore: font configuration, compiled font data
- uiStore: current wizard step, loading states, user preferences
```

### 4. Data Processing Pipeline

#### Phase 1: Image Input & Preprocessing
1. **Upload**: Accept PNG, JPG, TIFF, or scanned PDF pages
2. **Validation**: Check image quality, resolution, format compatibility
3. **Preprocessing**: Auto-crop, contrast enhancement, noise reduction
4. **Preview**: Show processed image with vectorization preview

#### Phase 2: Vectorization
1. **Parameter Selection**: Threshold, smoothing, corner detection
2. **Trace Generation**: Convert bitmap to SVG paths using Potrace
3. **Path Optimization**: Simplify curves, remove redundant points
4. **Quality Check**: Validate path integrity and visual fidelity

#### Phase 3: Glyph Refinement
1. **Interactive Editing**: Bezier curve adjustment, point manipulation
2. **Metrics Assignment**: Set baseline, x-height, ascender/descender
3. **Unicode Mapping**: Assign character codes to glyphs
4. **Quality Validation**: Check for common font issues

#### Phase 4: Font Compilation
1. **Glyph Assembly**: Combine all vectorized glyphs
2. **Metrics Calculation**: Compute font-wide metrics and spacing
3. **Font Generation**: Create TTF/OTF using opentype.js
4. **Validation**: Test font rendering across browsers/platforms

### 5. Deployment Strategy

**Simple Static Deployment**:
- Single HTML file with bundled CSS and JavaScript
- All assets inlined or bundled for Arweave deployment
- No external dependencies or API calls
- Works entirely offline after initial load

**Arweave Deployment**:
1. Build optimized static bundle using Vite
2. Deploy single-file application to Arweave
3. Permanent URL accessible via any Arweave gateway
4. No ongoing hosting costs or maintenance

### 6. Performance Considerations

#### Client-Side Processing
- **Web Workers**: Offload vectorization and font generation to prevent UI blocking
- **Streaming**: Process large images in chunks to maintain responsiveness
- **Caching**: Cache processed glyphs and intermediate results
- **Memory Management**: Dispose of large image data after processing

#### Asset Optimization
- **Code Splitting**: Lazy load processing libraries only when needed
- **Image Compression**: Optimize uploaded images before processing
- **Bundle Analysis**: Monitor and optimize JavaScript bundle size
- **Progressive Loading**: Load core UI first, processing tools second

### 7. User Experience Flow

#### Simple 5-Step Process:
1. **Welcome**: Brief introduction with examples, "Start Creating" button
2. **Upload**: Drag images or click to upload glyph drawings
3. **Vectorize**: Choose quality level (Fast/Balanced/High Quality) and process
4. **Create Font**: Assign characters, name your font
5. **Download**: Get your TTF/OTF file immediately

#### Design for Non-Technical Users:
- **No jargon**: Use plain language throughout ("Turn drawing into font")
- **Visual guidance**: Show examples of good vs. poor input images
- **Instant feedback**: Real-time preview as users make choices
- **Error prevention**: Clear file format requirements and size limits
- **Success celebration**: Satisfying download completion with usage tips

## Technology Stack Summary

### Core Dependencies
- **React 18+** with TypeScript for UI framework
- **Vite** for build tooling and development server
- **Zustand** for simple state management
- **Potrace.js** for high-quality bitmap-to-vector conversion
- **Custom vectorization** for fast processing option
- **opentype.js** for font file generation

### Development Tools
- **ESLint + Prettier** for code quality
- **Vitest** for unit testing
- **Playwright** for end-to-end testing
- **Storybook** for component development
- **TypeScript** for type safety
- **SCSS** for styling with CSS modules

### Deployment
- **Static site generation** for Arweave compatibility
- **Single-file bundle** for simple deployment
- **Arweave deployment** for permanent hosting

## Development Approach

1. **Start Simple**: Build core vectorization functionality first
2. **User Testing**: Test with real users early and often
3. **Progressive Enhancement**: Add quality options after basic version works
4. **Mobile-First**: Design for touch interfaces from the beginning

## Open Questions & Decisions Needed

1. **Image Quality**: What are the minimum/maximum resolution requirements?
2. **Font Formats**: Should we support WOFF/WOFF2 in addition to TTF/OTF?
3. **Character Sets**: How many characters should users be able to create at once?
4. **Processing Time**: What are acceptable wait times for each quality option?
5. **File Size**: What's the maximum input image size we should support?

---

*This document serves as a living architecture guide and will be updated as decisions are made and implementation progresses.*
