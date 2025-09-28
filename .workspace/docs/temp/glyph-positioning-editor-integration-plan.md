# Glyph Positioning Editor Integration Plan

## Overview

Integrate glyph positioning functionality directly into the existing `InteractiveSVGEditor` canvas, allowing users to:

1. **Move entire paths** relative to font metric lines
2. **Reposition individual nodes** with snapping to metric guides
3. **Visualize font metrics** (baseline, x-height, cap-height, ascender, descender) as guide lines
4. **Maintain existing functionality** while adding positioning capabilities

## Current State Analysis

### Existing Editor Features

- **Node-based editing**: Individual SVG path nodes can be selected, moved, added, deleted
- **Edit modes**: Select, Add, Delete modes with toolbar controls
- **Zoom and pan**: Full canvas navigation with mouse wheel and middle-click drag
- **Path manipulation**: SVG path reconstruction from node changes
- **Real-time updates**: Path changes trigger `onPathChanged` callback

### Current Architecture

```typescript
interface InteractiveSVGEditorProps {
  glyphId: string;
  initialPath: string;
  onPathChanged: (newPath: string) => void;
  viewBox?: { width: number; height: number };
  readOnly?: boolean;
  className?: string;
  fontMetrics?: {
    /* ... */
  }; // Already added but not fully utilized
}

interface PathEditingState {
  selectedNodeId: string | null;
  dragState: {
    /* ... */
  };
  hoveredNodeId: string | null;
  editMode: "select" | "add" | "delete";
}
```

## Integration Strategy

### 1. Extend Edit Modes

Add new positioning modes to existing `editMode` system:

```typescript
type EditMode = "select" | "add" | "delete" | "move-path" | "position-glyph";
```

### 2. Path-Level Selection

Enable selection and movement of entire paths, not just individual nodes:

```typescript
interface PathEditingState {
  // ... existing properties
  selectedPathId?: string | null; // For path-level operations
  isPathDragging?: boolean; // Distinguish from node dragging
}
```

### 3. Font Metric Visualization

Render guide lines directly on the SVG canvas:

- **Baseline**: Y=0 (horizontal line)
- **X-Height**: Y=xHeight (horizontal line)
- **Cap Height**: Y=capHeight (horizontal line)
- **Ascender**: Y=ascender (horizontal line)
- **Descender**: Y=descender (horizontal line)

## Implementation Plan

### Phase 1: Core Positioning Infrastructure

#### 1.1 Extend State Management

```typescript
interface PositioningState {
  showMetricGuides: boolean;
  snapToMetrics: boolean;
  metricSnapThreshold: number;
  pathOffset: { x: number; y: number };
  selectedMetricLine?:
    | "baseline"
    | "x-height"
    | "cap-height"
    | "ascender"
    | "descender";
}
```

#### 1.2 Add Path Selection Logic

```typescript
const handlePathClick = useCallback(
  (event: React.MouseEvent) => {
    if (editingState.editMode === "move-path") {
      // Select entire path for movement
      setEditingState((prev) => ({ ...prev, selectedPathId: "main-path" }));
    } else if (editingState.editMode === "add") {
      // Existing add node logic
    }
  },
  [editingState.editMode]
);
```

#### 1.3 Implement Path Dragging

```typescript
const handlePathDrag = useCallback(
  (event: React.MouseEvent) => {
    if (!editingState.selectedPathId || !isDraggingRef.current) return;

    const delta = calculateDragDelta(event);
    const newOffset = {
      x: positioningState.pathOffset.x + delta.x,
      y: positioningState.pathOffset.y + delta.y,
    };

    // Apply offset to all nodes
    const repositionedNodes = editableData.nodes.map((node) => ({
      ...node,
      x: node.x + delta.x,
      y: node.y + delta.y,
    }));

    setEditableData((prev) => ({ ...prev, nodes: repositionedNodes }));
    setPositioningState((prev) => ({ ...prev, pathOffset: newOffset }));
  },
  [editingState.selectedPathId, positioningState.pathOffset, editableData.nodes]
);
```

### Phase 2: Font Metric Visualization

#### 2.1 Render Metric Guide Lines

```typescript
const renderMetricGuides = () => {
  if (!fontMetrics || !positioningState.showMetricGuides) return null;

  return (
    <g className="metric-guides" style={{ pointerEvents: "none" }}>
      {/* Baseline */}
      <line
        x1="0"
        y1={fontMetrics.unitsPerEm - fontMetrics.baseline}
        x2="100%"
        y2={fontMetrics.unitsPerEm - fontMetrics.baseline}
        stroke="#28a745"
        strokeWidth={1 / zoomState.scale}
        strokeDasharray="5,5"
      />

      {/* X-Height */}
      <line
        x1="0"
        y1={fontMetrics.unitsPerEm - fontMetrics.xHeight}
        x2="100%"
        y2={fontMetrics.unitsPerEm - fontMetrics.xHeight}
        stroke="#17a2b8"
        strokeWidth={1 / zoomState.scale}
        strokeDasharray="3,3"
      />

      {/* Cap Height */}
      <line
        x1="0"
        y1={fontMetrics.unitsPerEm - fontMetrics.capHeight}
        x2="100%"
        y2={fontMetrics.unitsPerEm - fontMetrics.capHeight}
        stroke="#6f42c1"
        strokeWidth={1 / zoomState.scale}
        strokeDasharray="3,3"
      />

      {/* Ascender */}
      <line
        x1="0"
        y1={fontMetrics.unitsPerEm - fontMetrics.ascender}
        x2="100%"
        y2={fontMetrics.unitsPerEm - fontMetrics.ascender}
        stroke="#fd7e14"
        strokeWidth={1 / zoomState.scale}
        strokeDasharray="2,2"
      />

      {/* Descender */}
      <line
        x1="0"
        y1={fontMetrics.unitsPerEm - fontMetrics.descender}
        x2="100%"
        y2={fontMetrics.unitsPerEm - fontMetrics.descender}
        stroke="#e83e8c"
        strokeWidth={1 / zoomState.scale}
        strokeDasharray="2,2"
      />
    </g>
  );
};
```

#### 2.2 Add Metric Labels

```typescript
const renderMetricLabels = () => {
  if (!fontMetrics || !positioningState.showMetricGuides) return null;

  return (
    <g className="metric-labels" style={{ pointerEvents: "none" }}>
      <text
        x="5"
        y={fontMetrics.unitsPerEm - fontMetrics.baseline - 5}
        fontSize="10"
        fill="#28a745"
      >
        Baseline
      </text>
      <text
        x="5"
        y={fontMetrics.unitsPerEm - fontMetrics.xHeight - 5}
        fontSize="10"
        fill="#17a2b8"
      >
        X-Height
      </text>
      {/* ... other labels */}
    </g>
  );
};
```

### Phase 3: Smart Snapping

#### 3.1 Implement Metric Snapping

```typescript
const snapToMetrics = (y: number): number => {
  if (!fontMetrics || !positioningState.snapToMetrics) return y;

  const threshold = positioningState.metricSnapThreshold;
  const metrics = [
    fontMetrics.baseline,
    fontMetrics.xHeight,
    fontMetrics.capHeight,
    fontMetrics.ascender,
    fontMetrics.descender,
  ];

  for (const metric of metrics) {
    const metricY = fontMetrics.unitsPerEm - metric;
    if (Math.abs(y - metricY) < threshold) {
      return metricY;
    }
  }

  return y;
};
```

#### 3.2 Apply Snapping to Node Movement

```typescript
const handleNodeDrag = useCallback(
  (event: React.MouseEvent, nodeId: string) => {
    // ... existing drag logic

    const newY = snapToMetrics(svgCoords.y);
    const updatedNode = { ...node, y: newY };

    // Update node position
    const updatedNodes = editableData.nodes.map((n) =>
      n.id === nodeId ? updatedNode : n
    );

    setEditableData((prev) => ({ ...prev, nodes: updatedNodes }));
  },
  [editableData.nodes, snapToMetrics]
);
```

### Phase 4: Enhanced Toolbar

#### 4.1 Add Positioning Mode Buttons

```typescript
const renderToolbar = () => {
  return (
    <div className="absolute top-2 left-2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
      {/* Existing Edit Mode Tools */}
      <div className="flex gap-1">{/* ... existing buttons */}</div>

      {/* Divider */}
      <div className="w-px bg-gray-300"></div>

      {/* New Positioning Tools */}
      <div className="flex gap-1">
        <button
          onClick={() =>
            setEditingState((prev) => ({ ...prev, editMode: "move-path" }))
          }
          className={`p-2 rounded text-sm font-medium transition-colors ${
            editingState.editMode === "move-path"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Move entire glyph path"
        >
          Move Path
        </button>
        <button
          onClick={() =>
            setEditingState((prev) => ({ ...prev, editMode: "position-glyph" }))
          }
          className={`p-2 rounded text-sm font-medium transition-colors ${
            editingState.editMode === "position-glyph"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Position glyph relative to metrics"
        >
          Position
        </button>
      </div>

      {/* Metric Guide Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={positioningState.showMetricGuides}
            onChange={(e) =>
              setPositioningState((prev) => ({
                ...prev,
                showMetricGuides: e.target.checked,
              }))
            }
            className="rounded"
          />
          Guides
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={positioningState.snapToMetrics}
            onChange={(e) =>
              setPositioningState((prev) => ({
                ...prev,
                snapToMetrics: e.target.checked,
              }))
            }
            className="rounded"
          />
          Snap
        </label>
      </div>

      {/* Existing Zoom Controls */}
      <div className="w-px bg-gray-300"></div>
      {/* ... existing zoom controls */}
    </div>
  );
};
```

## Technical Implementation Details

### Coordinate System Handling

- **Maintain existing SVG coordinate system** (Y-down, origin at top-left)
- **Render metric guides** in SVG space with proper scaling
- **Apply positioning offsets** to all nodes when moving path
- **Preserve zoom and pan** functionality for all new features

### Performance Considerations

- **Metric guides** rendered with `pointerEvents: "none"` to avoid interference
- **Snapping calculations** only performed during drag operations
- **Path offset updates** batched to prevent excessive re-renders
- **Guide line rendering** optimized with proper stroke width scaling

### State Management

- **Extend existing state** rather than creating parallel systems
- **Positioning state** integrated with existing `editingState`
- **Path changes** trigger existing `onPathChanged` callback
- **Metric visibility** controlled through existing state patterns

## User Experience Flow

### 1. Path Movement Mode

1. User selects "Move Path" mode
2. Clicks on glyph path to select entire path
3. Drags to reposition glyph relative to metric guides
4. Visual feedback shows snapping to metric lines
5. Path updates in real-time with new positioning

### 2. Node Positioning Mode

1. User selects "Position" mode
2. Individual nodes snap to metric lines when dragged
3. Visual indicators show which metric line is being snapped to
4. Precise positioning relative to baseline, x-height, etc.

### 3. Metric Guide Interaction

1. Guides toggle on/off with checkbox
2. Different line styles for different metric types
3. Labels show metric names and values
4. Snapping threshold adjustable for precision

## Integration Points

### Font Creation Interface

- **Pass font metrics** to editor when available
- **Receive positioned paths** through existing `onPathChanged`
- **Coordinate with font generation** for proper baseline positioning

### SVG Path Editor Utils

- **Extend node manipulation** to support path-level operations
- **Add positioning helpers** for metric-based calculations
- **Maintain compatibility** with existing path reconstruction

### Coordinate Transformer

- **Leverage existing transformation** logic for font generation
- **Apply positioning offsets** before coordinate transformation
- **Ensure consistency** between editor positioning and final font

## Testing Strategy

### Unit Tests

- **Positioning state management** and updates
- **Metric guide rendering** with various font metrics
- **Snapping calculations** for different coordinate values
- **Path offset application** to node arrays

### Integration Tests

- **Editor mode switching** between positioning and editing modes
- **Path movement** with metric guide snapping
- **Coordinate system consistency** across zoom levels
- **Callback integration** with parent components

### User Acceptance Tests

- **Intuitive path movement** relative to metric guides
- **Precise node positioning** with snapping feedback
- **Performance** during complex positioning operations
- **Accessibility** of new positioning controls

## Success Metrics

### Functionality

- ✅ **Path-level movement** works smoothly with visual feedback
- ✅ **Metric guide rendering** is accurate and performant
- ✅ **Snapping behavior** provides precise positioning
- ✅ **Existing functionality** remains unchanged

### User Experience

- ✅ **Positioning controls** are intuitive and discoverable
- ✅ **Visual feedback** clearly shows positioning state
- ✅ **Performance** maintains responsive editing experience
- ✅ **Integration** feels natural within existing editor

### Technical Quality

- ✅ **Code structure** maintains existing patterns and architecture
- ✅ **State management** is clean and predictable
- ✅ **Performance** doesn't degrade existing functionality
- ✅ **Accessibility** follows existing standards

## Timeline

### Week 1: Core Infrastructure

- Extend state management for positioning
- Implement path selection and movement
- Add basic metric guide rendering

### Week 2: Smart Snapping

- Implement metric-based snapping logic
- Add snapping to node movement
- Integrate with existing drag operations

### Week 3: Enhanced UI

- Add positioning mode buttons to toolbar
- Implement metric guide toggles
- Add visual feedback for positioning

### Week 4: Testing & Polish

- Comprehensive testing of all features
- Performance optimization
- User experience refinement

## Risk Assessment

### Technical Risks

- **Performance impact** of additional rendering and calculations
- **Coordinate system complexity** with multiple positioning modes
- **State management complexity** with extended editing states

### Mitigation Strategies

- **Optimize rendering** with proper SVG optimization techniques
- **Maintain clear separation** between positioning and editing logic
- **Extensive testing** of state transitions and edge cases

### User Experience Risks

- **Feature discoverability** of new positioning modes
- **Learning curve** for positioning vs. editing modes
- **Visual clutter** with additional guide lines

### Mitigation Strategies

- **Clear visual feedback** for active positioning modes
- **Intuitive tooltips** and help text
- **Configurable guide visibility** to reduce clutter

## Conclusion

This integration plan maintains the existing editor's architecture while adding powerful glyph positioning capabilities. By extending the current edit mode system and integrating metric guides directly into the canvas, users will have intuitive control over glyph positioning relative to font metrics.

The implementation follows established patterns in the codebase, ensuring maintainability and consistency. The phased approach allows for iterative development and testing, reducing risk while delivering value incrementally.
