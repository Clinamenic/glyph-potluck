# Professional PNG to SVG Vectorization Research

## Industry Standard Methods

### 1. Marching Squares Algorithm

**The gold standard for bitmap to vector conversion**

- Used by Potrace, Inkscape, Adobe Illustrator
- Creates accurate contours by analyzing 2x2 pixel neighborhoods
- Generates smooth curves through Bézier fitting

### 2. Current Problem Analysis

Looking at the generated paths:

```svg
M96,53c75.64024,-101.18629 303.35976,-101.18629 379,0c101.18629,135.36002 101.18629,371.63998 0,507
```

- Coordinates are outside 200x200 viewBox (96→475, 53→560)
- Paths are generic ellipses, not actual letter shapes
- No relationship to original image content

### 3. Root Cause

Our current implementation:

1. Finds bounding box of dark pixels ✓
2. Creates generic geometric shapes ❌
3. Doesn't follow actual contours ❌
4. Paper.js is creating bezier curves from wrong data ❌

## Professional Solution: Marching Squares

### Algorithm Overview

```
For each 2x2 pixel neighborhood:
1. Determine binary state (4 bits = 16 cases)
2. Lookup contour segments for that case
3. Connect segments to form complete contours
4. Fit Bézier curves to smooth paths
```

### Implementation Strategy

#### Phase 1: Bitmap Preparation

```javascript
function createBinaryBitmap(imageData, threshold) {
  // Convert to binary: 1 = dark pixel, 0 = light pixel
  // Add padding border for edge cases
}
```

#### Phase 2: Marching Squares

```javascript
function marchingSquares(bitmap) {
  // 16 lookup cases for contour segments
  // Connect segments into closed paths
  // Handle multiple disconnected regions
}
```

#### Phase 3: Curve Fitting

```javascript
function fitBezierCurves(contourPoints) {
  // Convert linear segments to smooth curves
  // Optimize for font rendering (readable at small sizes)
}
```

## Implementation Plan

### Step 1: Replace Paper.js Approach

- Paper.js is overcomplicating simple vectorization
- Implement direct marching squares algorithm
- Use HTML5 Canvas Path2D for path creation

### Step 2: Marching Squares Lookup Table

```javascript
const MARCHING_SQUARES_LOOKUP = {
  0: [], // No contour
  1: [
    [
      [0, 0.5],
      [0.5, 1],
    ],
  ], // Bottom-left corner
  2: [
    [
      [0.5, 1],
      [1, 0.5],
    ],
  ], // Bottom-right corner
  // ... 16 total cases
};
```

### Step 3: Accurate Coordinate Normalization

- Scale to fit 160x160 content area (20px padding)
- Maintain aspect ratio
- Center within 200x200 viewBox

### Step 4: Quality Levels

- **Fast**: Basic marching squares, minimal smoothing
- **Balanced**: Marching squares + curve fitting
- **High**: Marching squares + advanced curve optimization

## Expected Results

### Before (Current)

- Generic ellipses/rectangles
- Wrong coordinates (96-507 range)
- No relationship to actual drawing

### After (Marching Squares)

- Accurate contour following
- Proper coordinates (20-180 range)
- Letter "A" shape clearly recognizable
- Professional quality suitable for font generation

## Technical References

1. **Potrace Algorithm**: Peter Selinger's industry-standard implementation
2. **Adobe Illustrator**: Live Trace feature uses similar principles
3. **Inkscape**: Trace Bitmap function based on marching squares
4. **OpenCV**: cv2.findContours() for reference implementation

This approach will transform the vectorization from "random shapes" to "accurate letter tracing" - exactly what's needed for a professional font creation tool.
