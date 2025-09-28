# Font Analysis Development Tools

These tools are designed for temporary use during development and quality control of the font generation pipeline. They help analyze generated font files and compare them with the original vectorized glyphs.

## Tools Overview

### 1. FontInspector

Analyzes font files and extracts detailed glyph information including:

- Glyph metadata (unicode, name, advance width)
- Path data and bounding boxes
- Coordinate system detection
- Quality metrics calculation

### 2. PathComparator

Compares original SVG paths with generated OpenType glyph paths:

- Coordinate system validation
- Orientation checking
- Path structure analysis
- Similarity scoring

### 3. FontAnalysisOrchestrator

Coordinates comprehensive analysis:

- Combines font analysis and path comparison
- Generates summary reports
- Exports results in multiple formats
- Provides actionable recommendations

## Usage Examples

### Basic Font Analysis

```typescript
import { FontAnalysisOrchestrator } from '.workspace/dev-tools/font-analysis';

// Analyze a generated font file
const fontFile = /* your generated .ttf or .otf file */;
const analysis = await FontAnalysisOrchestrator.analyzeFontOnly(fontFile);

console.log('Font quality:', analysis.qualityMetrics.overallScore);
console.log('Coordinate system:', analysis.coordinateSystem);
```

### Comprehensive Analysis with Path Comparison

```typescript
import { FontAnalysisOrchestrator } from ".workspace/dev-tools/font-analysis";

// Map of original SVG paths by unicode
const originalPaths = new Map<number, string>();
originalPaths.set(65, "M 10 10 L 190 10 L 100 190 Z"); // A
originalPaths.set(66, "M 10 10 L 190 10 L 100 190 Z"); // B

// Comprehensive analysis
const results = await FontAnalysisOrchestrator.analyzeFontComprehensive(
  fontFile,
  originalPaths,
  {
    includeDetailedGlyphs: true,
    includePathComparison: true,
    includeQualityMetrics: true,
    exportFormats: ["text", "json"],
  }
);

console.log("Overall quality:", results.summary.overallQuality);
console.log("Critical issues:", results.summary.criticalIssues);
console.log("Recommendations:", results.summary.recommendations);
```

### Export Results

```typescript
// Export as text report
const textReport = FontAnalysisOrchestrator.exportResults(results, "text");
console.log(textReport);

// Export as JSON for programmatic use
const jsonReport = FontAnalysisOrchestrator.exportResults(results, "json");
const parsed = JSON.parse(jsonReport);

// Export as HTML for viewing in browser
const htmlReport = FontAnalysisOrchestrator.exportResults(results, "html");
```

## Integration with Main App

To use these tools in the main application:

1. **Import the tools** in your component:

```typescript
import { FontAnalysisOrchestrator } from ".workspace/dev-tools/font-analysis";
```

2. **Collect original paths** from your vectorized characters:

```typescript
const originalPaths = new Map<number, string>();
vectorizedCharacters.forEach((char) => {
  if (char.vectorData) {
    originalPaths.set(char.unicode, char.vectorData);
  }
});
```

3. **Analyze after font generation**:

```typescript
const handleFontGenerated = async (fontFile: File) => {
  try {
    const results = await FontAnalysisOrchestrator.analyzeFontComprehensive(
      fontFile,
      originalPaths
    );

    // Display results in UI or console
    console.log("Analysis results:", results);

    // Check for critical issues
    if (results.summary.criticalIssues > 0) {
      console.error(
        "Critical issues detected:",
        results.summary.recommendations
      );
    }
  } catch (error) {
    console.error("Font analysis failed:", error);
  }
};
```

## What to Look For

### Critical Issues (Must Fix)

- **No glyphs found**: Font generation completely failed
- **Coordinate system unknown**: Cannot determine Y-axis orientation
- **Path generation failed**: Glyphs have no path data

### High Priority Issues (Should Fix)

- **Orientation mismatch**: Characters appear upside down
- **Coordinate system issues**: Y-coordinates outside expected ranges
- **Low path similarity**: Generated glyphs don't match originals

### Medium Priority Issues (Consider Fixing)

- **Open paths**: Glyphs not properly closed
- **Unusual coordinate ranges**: May indicate transformation problems
- **Quality below threshold**: Overall font quality needs improvement

## Debugging Tips

1. **Check console logs**: All tools provide detailed logging
2. **Export reports**: Use different formats to examine data
3. **Compare specific glyphs**: Focus on problematic characters first
4. **Validate coordinate transformation**: Ensure Y-axis is properly flipped
5. **Check path integrity**: Verify SVG paths are valid and complete

## Temporary Nature

These tools are designed for development use only and should not be included in the production application. They help:

- Debug font generation issues
- Validate coordinate transformations
- Ensure glyph quality
- Fine-tune the generation pipeline

Once the font generation is working correctly, these tools can be removed or disabled.
