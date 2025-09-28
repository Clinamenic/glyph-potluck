# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.0 - 2025-09-28

### Added
- feat: comprehensive font creation studio with character grid system (refs 8c094eb)
- Character upload grid with drag-and-drop functionality and status tracking
- Font generation, compilation, and export services with TTF/OTF support
- Character data storage system with IndexedDB integration
- Font settings panel with metadata configuration and advanced options
- Font preview component with multiple display modes (sample text, character grid, custom)
- Character preview panel with vector editing capabilities
- Font export panel with multiple format options
- Character set management with basic Latin character definitions
- Comprehensive planning documentation for future feature development
- Font analysis and debugging tools for development

### Changed
- Complete UI overhaul from simple file upload to professional font creation studio
- Enhanced type definitions for font creation workflow and character data
- Improved vectorization pipeline integration with font generation
- Extended component architecture with modular font creation components

### Dependencies
- Added fontkit for font file manipulation and analysis
- Added opentype.js for font generation and compilation
- Added idb for IndexedDB storage management
- Added svg-path-parser for SVG path manipulation
- Added comprehensive TypeScript type definitions

## 0.2.0 - 2025-08-29

### Added
- feat: Interactive SVG Editor with full node manipulation capabilities (refs 9e52819)
- Zoom and pan functionality with mouse wheel and toolbar controls
- Complete SVG path editing utilities (add/remove/move nodes)
- Character grid upload transition planning documentation
- Vectorization debugging interface with detailed metrics
- Professional UI with emoji removal for clean appearance

### Changed
- Migrated to "Trace Target Perfect" as the single vectorization method
- Enhanced font preview component with editing modes
- Improved error handling and user feedback throughout interface
- Streamlined vectorization pipeline for better performance
- Extended type definitions for interactive editing features

### Fixed
- ImageTracer library integration and instantiation issues
- Node deletion restrictions for path integrity
- Zoom coordinate transformation accuracy
- UI responsiveness and visual feedback

## 0.1.0 - 2025-08-24

### Added
- feat(project): initial project setup for Glyph Potluck (refs 5c7413d)
- Comprehensive architecture documentation for Arweave-based font creation tool
- React + TypeScript + Vite configuration for single-page application
- Multiple vectorization quality options (Fast/Balanced/High Quality)
- Simplified 5-step wizard interface designed for non-technical users
- Technology stack analysis and component architecture planning
- Workspace scaffolding with scripts, configuration, and documentation structure
- Support for converting hand-drawn glyphs to TTF/OTF font files
- Client-side processing with no data storage requirements
- Deployment strategy for Arweave permaweb hosting
