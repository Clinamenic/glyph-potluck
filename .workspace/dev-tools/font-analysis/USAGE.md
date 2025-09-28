# Font Dev Tools - Usage Guide

## Quick Start

1. **Open the dev tools loader** in your browser:

   ```
   file:///path/to/.workspace/dev-tools/font-analysis/dev-tools-loader.html
   ```

2. **Generate a font** in your main Glyph Potluck application

3. **Open browser console** (F12 → Console)

4. **Run analysis**:
   ```javascript
   window.FontDevTools.analyzeCurrentFont();
   ```

## Available Commands

### `window.FontDevTools.analyzeCurrentFont()`

- Analyzes the currently generated font
- Compares with original vectorized glyphs
- Provides detailed quality report
- Shows coordinate system analysis

### `window.FontDevTools.quickQualityCheck()`

- Quick quality assessment
- Returns true/false for quality threshold
- Shows basic metrics

### `window.FontDevTools.analyzeCharacter(unicode)`

- Analyzes a specific character
- Example: `window.FontDevTools.analyzeCharacter(65)` for 'A'
- Shows transformation details

### `window.FontDevTools.help()`

- Shows available commands
- Provides usage examples

## What You'll See

### Console Output Example

```
🔍 Font analysis started: MyFont
✅ Font analysis completed
🔍 Starting path comparison...
  Original paths: 1
  Generated glyphs: 1
🔍 Comparing U+0041:
  Original: M 10 10 L 190 10 L 100 190 Z...
  Generated: M 10 990 L 190 990 L 100 810 Z...
✅ Path comparison completed

📋 Font Analysis Results:
==========================
Overall Quality: 95%
Critical Issues: 0
Font Name: MyFont
Glyph Count: 1
Coordinate System: y-up
Path Similarity: 95%
Orientation Issues: 0
```

### Key Metrics to Watch

- **Overall Quality**: Should be >80%
- **Critical Issues**: Should be 0
- **Coordinate System**: Should be 'y-up' (not 'unknown')
- **Path Similarity**: Should be >90%
- **Orientation Issues**: Should be 0

## Troubleshooting

### "No font file found"

- Generate a font first in the main app
- Make sure the font generation completed successfully

### "No original paths found"

- Vectorize some characters first
- Check that characters have `vectorData`

### "Coordinate system unknown"

- Font may have corrupted glyph data
- Check font generation process

### Characters still upside down

- Coordinate transformation may not be working
- Check the Y-coordinate values in the analysis

## Advanced Usage

### Access Last Analysis Results

```javascript
// Results are stored in:
window.__LAST_FONT_ANALYSIS__;

// Access specific data:
const results = window.__LAST_FONT_ANALYSIS__;
console.log("Font quality:", results.summary.overallQuality);
console.log("Glyph count:", results.fontAnalysis.glyphCount);
```

### Export Results

```javascript
// Get results first
const results = await window.FontDevTools.analyzeCurrentFont();

// Export as text (console output)
const textReport = FontAnalysisOrchestrator.exportResults(results, "text");
console.log(textReport);

// Export as JSON
const jsonReport = FontAnalysisOrchestrator.exportResults(results, "json");
console.log(jsonReport);
```

### Debug Specific Issues

```javascript
// Check coordinate transformation
const glyphA = await window.FontDevTools.analyzeCharacter(65);
console.log("Glyph A Y range:", glyphA.yCoordinateRange);

// Quick quality check
const isGood = await window.FontDevTools.quickQualityCheck();
console.log("Font quality OK:", isGood);
```

## Integration Tips

- **Keep dev tools open** in a separate tab while working
- **Run analysis after each font generation** to catch issues early
- **Check console logs** for detailed debugging information
- **Use character analysis** to debug specific problematic glyphs
- **Export reports** for documentation or sharing issues

## Removing from Production

These tools are for development only. To remove them:

1. Delete the `.workspace/dev-tools/` directory
2. Remove any references to `FontDevTools` in production code
3. Ensure no console commands are left in production builds

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify the main app has generated a font
3. Ensure characters have been vectorized
4. Check that the dev tools loaded successfully

The tools will provide specific error messages and recommendations for fixing issues.
