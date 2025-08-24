# Glyph Potluck - Revised Architecture Summary

## Simplified Project Vision

**Glyph Potluck** is a simple, accessible single-page web application that enables anyone to convert hand-drawn letters into a working font file. The focus is on ease of use for non-technical users with multiple quality options for vectorization.

## Core User Experience

### 5-Step Wizard Process
1. **Upload**: Drag and drop images of hand-drawn letters
2. **Choose Quality**: Select Fast, Balanced, or High Quality vectorization  
3. **Preview**: See vectorized results with simple adjustments
4. **Create Font**: Assign letters and name the font
5. **Download**: Get TTF/OTF file immediately

### Design for Non-Technical Users
- Plain language throughout ("Turn your drawings into a font")
- Visual examples of good input images
- Large, clear buttons and progress indicators
- No technical parameters or complex options
- Mobile-friendly touch interface

## Technical Architecture

### Simple Stack
- **React 18+ with TypeScript**: Single-page application
- **Vite**: Fast development and optimized static builds
- **Zustand**: Lightweight state management
- **opentype.js**: Font file generation (TTF/OTF)

### Vectorization Options
**Three Quality Levels**:

1. **Fast** (Custom Canvas API Implementation)
   - JavaScript-based edge detection
   - ~1-3 seconds processing
   - Good for simple, clean drawings
   - Smaller bundle size

2. **Balanced** (Optimized Potrace.js)
   - Potrace with simplified parameters
   - ~3-8 seconds processing  
   - Good quality for most use cases
   - Recommended default

3. **High Quality** (Full Potrace.js)
   - Professional vectorization algorithm
   - ~5-15 seconds processing
   - Best for detailed, artistic glyphs
   - WebAssembly performance

### No Data Storage
- Everything happens locally in the browser
- No user accounts, logins, or cloud storage
- Users simply download their font files
- No privacy concerns or data persistence needs

## Deployment Strategy

### Single Static Application
- Build one optimized HTML file with inlined assets
- Deploy to Arweave for permanent, decentralized hosting
- Works completely offline after initial load
- No ongoing hosting costs or maintenance

### Build Configuration
```javascript
// Vite config for single-file deployment
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'glyph-potluck.js',
        assetFileNames: 'glyph-potluck.[ext]'
      }
    }
  }
});
```

## Component Structure

### Simplified UI Components
```
App
├── WizardContainer
│   ├── Step1_Upload
│   ├── Step2_Vectorize
│   ├── Step3_Preview  
│   ├── Step4_FontCreate
│   └── Step5_Download
├── ProgressIndicator
└── HelpTooltips
```

### State Management
```typescript
// Three simple stores
interface AppState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  uploadedImages: ImageFile[];
  vectorizedGlyphs: ProcessedGlyph[];
  fontData: CompiledFont | null;
  processing: boolean;
}
```

## Development Priorities

### Phase 1: Core Functionality
- [ ] Basic file upload and preview
- [ ] One vectorization method working (start with Fast option)
- [ ] Simple font generation with opentype.js
- [ ] Download functionality

### Phase 2: Quality Options  
- [ ] Implement all three vectorization quality levels
- [ ] User choice interface with clear explanations
- [ ] Performance optimization and progress feedback

### Phase 3: Polish
- [ ] Mobile-responsive design
- [ ] Error handling and user guidance
- [ ] Accessibility improvements
- [ ] Final deployment optimization

## Key Technical Decisions

### Vectorization Implementation
- **Start with Canvas API**: Build custom fast vectorization first (simpler)
- **Add Potrace.js**: Integrate WebAssembly version for quality options
- **Progressive Loading**: Load heavy libraries only when needed

### User Interface
- **Wizard Pattern**: Linear flow prevents confusion
- **Visual Feedback**: Show processing with animated progress
- **Error Prevention**: Guide users toward success with examples

### Bundle Optimization
- **Code Splitting**: Load vectorization libraries on-demand
- **Asset Inlining**: Single-file deployment for Arweave
- **Performance Budget**: Target <2MB total bundle size

## Success Metrics

### User Experience
- Users can complete the entire process in under 5 minutes
- 80%+ completion rate from upload to download
- Works smoothly on mobile devices
- Clear error messages when something goes wrong

### Technical Performance
- Fast option: <3 seconds processing time
- Balanced option: <8 seconds processing time  
- High quality: <15 seconds processing time
- Total app bundle: <2MB for initial load

## Next Steps

### Immediate Development
1. Set up React + TypeScript + Vite project
2. Create basic wizard UI structure
3. Implement file upload with preview
4. Build custom fast vectorization using Canvas API
5. Integrate opentype.js for basic font generation

### Questions to Resolve
1. **Maximum file size**: What's the largest image we should accept?
2. **Supported formats**: PNG, JPG, what about hand-scanned PDFs?
3. **Character limit**: How many letters can be in one font?
4. **Font naming**: Any restrictions on font family names?
5. **Browser support**: How far back should we support (IE, old mobile)?

---

*This revised architecture focuses on simplicity, accessibility, and a great user experience for non-technical users while providing the flexibility of multiple quality options.*
