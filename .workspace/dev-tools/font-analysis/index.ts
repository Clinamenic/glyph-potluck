// Font Analysis Development Tools
// These tools are for temporary use during development and quality control

export { FontInspector, type FontAnalysis, type GlyphAnalysis, type PathCommand } from './FontInspector';
export { PathComparator, type PathComparison, type PathDifference, type ComparisonReport } from './PathComparator';
export { FontAnalysisOrchestrator, type FontAnalysisResult, type AnalysisOptions } from './FontAnalysisOrchestrator';
export { DevConsoleBridge } from './dev-console-bridge';

// Re-export types for convenience
export type {
  FontAnalysis,
  GlyphAnalysis,
  PathCommand,
  PathComparison,
  PathDifference,
  ComparisonReport,
  FontAnalysisResult,
  AnalysisOptions
} from './FontAnalysisOrchestrator';
