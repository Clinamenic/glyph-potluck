import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SVGPathNode, EditablePathData, PathEditingState, PositioningState } from '@/types';
import { SVGPathEditor, findClosestNode } from '@/utils/svgPathEditor';

export interface InteractiveSVGEditorProps {
  glyphId: string;
  initialPath: string;
  onPathChanged: (newPath: string) => void;
  viewBox?: { width: number; height: number };
  readOnly?: boolean;
  className?: string;
  fontMetrics?: {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    xHeight: number;
    capHeight: number;
    baseline: number;
  };
}

export function InteractiveSVGEditor({
  glyphId,
  initialPath,
  onPathChanged,
  viewBox = { width: 200, height: 200 },
  readOnly = false,
  className = "",
  fontMetrics,
}: InteractiveSVGEditorProps) {
  // State management
  const [editableData, setEditableData] = useState<EditablePathData>(() => {
    try {
      return SVGPathEditor.createEditablePathData(initialPath, viewBox);
    } catch (error) {
      console.error('❌ Failed to parse path for editing:', error);
      // Fallback: create minimal editable data
      return {
        nodes: [],
        viewBox: { ...viewBox, x: 0, y: 0 },
        originalPath: initialPath,
      };
    }
  });

  const [editingState, setEditingState] = useState<PathEditingState>({
    selectedNodeId: null,
    dragState: {
      isDragging: false,
      startPosition: { x: 0, y: 0 },
      nodeId: null,
    },
    hoveredNodeId: null,
    editMode: "select",
  });

  // Zoom and pan state
  const [zoomState, setZoomState] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    minScale: 0.1,
    maxScale: 10,
  });

  // Glyph positioning state
  const [positioningState, setPositioningState] = useState<PositioningState>({
    showMetricGuides: true,
    snapToMetrics: true,
    metricSnapThreshold: 5,
    pathOffset: { x: 0, y: 0 },
    selectedMetricLine: undefined,
  });

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });
  const lastNotifiedPath = useRef<string>('');
  const onPathChangedRef = useRef(onPathChanged);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update the ref when onPathChanged changes
  useEffect(() => {
    onPathChangedRef.current = onPathChanged;
  }, [onPathChanged]);

  // Update editable data when initial path changes
  useEffect(() => {
    try {
      const newEditableData = SVGPathEditor.createEditablePathData(initialPath, viewBox);
      setEditableData(newEditableData);
      // Reset the last notified path when initial path changes
      lastNotifiedPath.current = initialPath;
    } catch (error) {
      console.error('❌ Failed to parse updated path for editing:', error);
      // Fallback: keep original path but clear nodes
      setEditableData({
        nodes: [],
        viewBox: { ...viewBox, x: 0, y: 0 },
        originalPath: initialPath,
      });
      lastNotifiedPath.current = initialPath;
    }
  }, [initialPath, viewBox]);

  // Smart snapping to metric lines
  const snapToMetrics = useCallback((y: number): number => {
    if (!fontMetrics || !positioningState.snapToMetrics) return y;

    const threshold = positioningState.metricSnapThreshold;
    const metrics = [
      0, // baseline
      fontMetrics.xHeight,
      fontMetrics.capHeight,
      fontMetrics.ascender,
      fontMetrics.descender
    ];

    for (const metric of metrics) {
      const metricY = fontMetrics.unitsPerEm - metric;
      if (Math.abs(y - metricY) < threshold) {
        console.log(`🎯 Snapped to metric: ${metric} at Y=${metricY}`);
        return metricY;
      }
    }

    return y;
  }, [fontMetrics, positioningState.snapToMetrics, positioningState.metricSnapThreshold]);

  // Generate current path string and notify parent of changes
  const currentPath = editableData.nodes.length > 0
    ? SVGPathEditor.nodesToPathString(editableData.nodes)
    : editableData.originalPath;

  // Only notify parent of changes when path actually changes from last notification
  useEffect(() => {
    if (currentPath !== initialPath && !readOnly && currentPath !== lastNotifiedPath.current) {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the notification by 150ms to avoid rapid-fire updates during dragging
      debounceTimerRef.current = setTimeout(() => {
        lastNotifiedPath.current = currentPath;
        onPathChangedRef.current(currentPath);
        debounceTimerRef.current = null;
      }, 150);
    }
  }, [currentPath, initialPath, readOnly]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Convert screen coordinates to SVG coordinates (accounting for zoom and pan)
  const screenToSVG = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();

    // Convert to normalized coordinates (0-1)
    const normalizedX = (clientX - rect.left) / rect.width;
    const normalizedY = (clientY - rect.top) / rect.height;

    // Convert to SVG coordinates accounting for zoom and pan
    const svgX = (normalizedX * viewBox.width - zoomState.translateX) / zoomState.scale;
    const svgY = (normalizedY * viewBox.height - zoomState.translateY) / zoomState.scale;

    return { x: svgX, y: svgY };
  }, [viewBox, zoomState]);

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (readOnly) return;

    const result = SVGPathEditor.removeNode(editableData.nodes, nodeId);

    if (!result.success) {
      // Show user feedback for failed deletion
      console.warn(`❌ Cannot delete node: ${result.message}`);
      // You could add a toast notification here in the future
      alert(`Cannot delete this node: ${result.message}`);
      return;
    }

    const newPath = SVGPathEditor.nodesToPathString(result.nodes);

    setEditableData(prev => ({
      ...prev,
      nodes: result.nodes,
      originalPath: newPath,
    }));

    // Clear selection if deleted node was selected
    if (editingState.selectedNodeId === nodeId) {
      setEditingState(prev => ({ ...prev, selectedNodeId: null }));
    }

    console.log(`🗑️ Deleted node ${nodeId}: ${result.message}`);
  }, [readOnly, editableData.nodes, editingState.selectedNodeId]);

  // Handle mouse down on nodes
  const handleNodeMouseDown = useCallback((event: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;

    event.preventDefault();
    event.stopPropagation();

    // Handle delete mode - delete on click
    if (editingState.editMode === "delete") {
      handleNodeDelete(nodeId);
      return;
    }

    // Handle select mode - start dragging
    if (editingState.editMode === "select") {
      const svgCoords = screenToSVG(event.clientX, event.clientY);

      setEditingState(prev => ({
        ...prev,
        selectedNodeId: nodeId,
        dragState: {
          isDragging: true,
          startPosition: svgCoords,
          nodeId,
        },
      }));

      isDraggingRef.current = true;
      console.log(`🖱️ Started dragging node ${nodeId}`);
    }
  }, [readOnly, editingState.editMode, screenToSVG, handleNodeDelete]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (readOnly || !isDraggingRef.current || !editingState.dragState.nodeId) return;

    const svgCoords = screenToSVG(event.clientX, event.clientY);

    // Apply snapping in move-path mode if path is selected
    let finalCoords = svgCoords;
    if (editingState.editMode === "move-path" && editingState.selectedPathId) {
      finalCoords = {
        x: svgCoords.x,
        y: snapToMetrics(svgCoords.y)
      };
    }

    // Update node position
    const newNodes = SVGPathEditor.moveNode(
      editableData.nodes,
      editingState.dragState.nodeId,
      finalCoords
    );

    setEditableData(prev => ({
      ...prev,
      nodes: newNodes,
    }));
  }, [readOnly, editableData.nodes, editingState.dragState.nodeId, screenToSVG, editingState.editMode, snapToMetrics]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      console.log('🖱️ Ended dragging');
      isDraggingRef.current = false;
      setEditingState(prev => ({
        ...prev,
        dragState: {
          isDragging: false,
          startPosition: { x: 0, y: 0 },
          nodeId: null,
        },
      }));
    }
  }, []);

  // Force stop all dragging (emergency stop)
  const forceStopDragging = useCallback(() => {
    console.log('🛑 Force stopping all dragging');
    isDraggingRef.current = false;
    setEditingState(prev => ({
      ...prev,
      dragState: {
        isDragging: false,
        startPosition: { x: 0, y: 0 },
        nodeId: null,
      },
      selectedPathId: null,
      isPathHovered: false,
    }));
  }, []);

  // Add keyboard event handler for emergency stop
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        forceStopDragging();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceStopDragging]);

  // Handle node hover
  const handleNodeMouseEnter = useCallback((nodeId: string) => {
    if (!readOnly) {
      setEditingState(prev => ({ ...prev, hoveredNodeId: nodeId }));
    }
  }, [readOnly]);

  const handleNodeMouseLeave = useCallback(() => {
    if (!readOnly) {
      setEditingState(prev => ({ ...prev, hoveredNodeId: null }));
    }
  }, [readOnly]);

  // Handle path click for different edit modes
  const handlePathClick = useCallback((event: React.MouseEvent) => {
    if (readOnly) return;

    const svgCoords = screenToSVG(event.clientX, event.clientY);

    if (editingState.editMode === "add") {
      // Add new node logic
      const closestNode = findClosestNode(editableData.nodes, svgCoords, 50);
      if (!closestNode) return;

      const newNodes = SVGPathEditor.addNode(
        editableData.nodes,
        svgCoords,
        closestNode.id
      );

      setEditableData(prev => ({
        ...prev,
        nodes: newNodes,
      }));

      console.log(`➕ Added new node at (${svgCoords.x.toFixed(1)}, ${svgCoords.y.toFixed(1)})`);
    } else if (editingState.editMode === "move-path") {
      // Toggle path selection
      if (editingState.selectedPathId) {
        setEditingState(prev => ({
          ...prev,
          selectedPathId: null,
          isPathHovered: false
        }));
        console.log('🎯 Path deselected');
      } else {
        setEditingState(prev => ({
          ...prev,
          selectedPathId: "main-path",
          selectedNodeId: null // Clear node selection when selecting path
        }));
        console.log('🎯 Path selected for movement');
      }
    }
  }, [readOnly, editingState.editMode, editableData.nodes, screenToSVG]);

  // Handle node right-click for context menu
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;

    event.preventDefault();

    // For now, just delete the node on right-click
    // In a full implementation, this would show a context menu
    if (editingState.editMode === "delete") {
      handleNodeDelete(nodeId);
    }
  }, [readOnly, editingState.editMode, handleNodeDelete]);

  // Handle wheel zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!svgRef.current) return;

    event.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = (event.clientX - rect.left) / rect.width;
    const centerY = (event.clientY - rect.top) / rect.height;

    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    setZoomState(prev => {
      const newScale = Math.max(prev.minScale, Math.min(prev.maxScale, prev.scale * zoomFactor));
      const scaleDiff = newScale - prev.scale;

      // Zoom towards cursor position
      const newTranslateX = prev.translateX - centerX * viewBox.width * scaleDiff;
      const newTranslateY = prev.translateY - centerY * viewBox.height * scaleDiff;

      return {
        ...prev,
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      };
    });
  }, [viewBox]);

  // Handle pan start
  const handlePanStart = useCallback((event: React.MouseEvent) => {
    // Allow panning with middle mouse button (existing) or left mouse on empty canvas
    const isMiddleMouse = event.button === 1;

    // For left mouse, allow panning unless we're clearly on an interactive element
    const target = event.target as Element;
    const isOnInteractiveElement = target && (
      target.tagName === 'circle' || // node handles
      target.closest('[data-interactive]') || // elements marked as interactive
      (target === event.currentTarget && editingState.editMode === 'move-path' && editingState.selectedPathId) // path when in move mode
    );

    const isLeftMouseAllowed = event.button === 0 && !isOnInteractiveElement;

    if (!isMiddleMouse && !isLeftMouseAllowed) return;

    event.preventDefault();
    isPanningRef.current = true;
    lastPanPosition.current = { x: event.clientX, y: event.clientY };
  }, [editingState.editMode, editingState.selectedPathId]);

  // Handle pan move
  const handlePanMove = useCallback((event: React.MouseEvent) => {
    if (!isPanningRef.current) return;

    const deltaX = event.clientX - lastPanPosition.current.x;
    const deltaY = event.clientY - lastPanPosition.current.y;

    setZoomState(prev => {
      const newTranslateX = prev.translateX + deltaX;
      const newTranslateY = prev.translateY + deltaY;

      // Apply reasonable boundaries (allow some over-pan for natural feel)
      const maxPan = 1000; // Maximum pan distance
      const constrainedTranslateX = Math.max(-maxPan, Math.min(maxPan, newTranslateX));
      const constrainedTranslateY = Math.max(-maxPan, Math.min(maxPan, newTranslateY));

      return {
        ...prev,
        translateX: constrainedTranslateX,
        translateY: constrainedTranslateY,
      };
    });

    lastPanPosition.current = { x: event.clientX, y: event.clientY };
  }, []);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  // Handle path dragging for positioning
  const handlePathDrag = useCallback((event: React.MouseEvent) => {
    if (!editingState.selectedPathId || !isDraggingRef.current) return;

    const deltaX = event.movementX / zoomState.scale;
    const deltaY = event.movementY / zoomState.scale;

    // Only move if there's actual movement
    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) return;

    const newOffset = {
      x: positioningState.pathOffset.x + deltaX,
      y: positioningState.pathOffset.y + deltaY
    };

    // Apply offset to all nodes
    const repositionedNodes = editableData.nodes.map(node => ({
      ...node,
      x: node.x + deltaX,
      y: node.y + deltaY
    }));

    setEditableData(prev => ({ ...prev, nodes: repositionedNodes }));
    setPositioningState(prev => ({ ...prev, pathOffset: newOffset }));

    console.log(`🔄 Path moved by (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`);
  }, [editingState.selectedPathId, positioningState.pathOffset, editableData.nodes, zoomState.scale]);

  // Handle path mouse down for dragging
  const handlePathMouseDown = useCallback((event: React.MouseEvent) => {
    if (readOnly || editingState.editMode !== "move-path" || !editingState.selectedPathId) return;

    if (event.button === 0) { // Left mouse button
      event.stopPropagation(); // Prevent canvas panning when dragging paths
      isDraggingRef.current = true;
      console.log('🖱️ Started dragging path');
    }
  }, [readOnly, editingState.editMode, editingState.selectedPathId]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.min(prev.maxScale, prev.scale * 1.2),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.max(prev.minScale, prev.scale / 1.2),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: 1,
      translateX: 0,
      translateY: 0,
    }));
  }, []);

  const zoomToFit = useCallback(() => {
    if (!editableData.nodes.length) return;

    // Calculate bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    editableData.nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    if (!isFinite(minX)) return;

    const padding = 20;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    const scaleX = viewBox.width / contentWidth;
    const scaleY = viewBox.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, zoomState.maxScale);

    const newTranslateX = (viewBox.width / 2 - contentCenterX) * newScale;
    const newTranslateY = (viewBox.height / 2 - contentCenterY) * newScale;

    setZoomState(prev => ({
      ...prev,
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    }));
  }, [editableData.nodes, viewBox, zoomState.maxScale]);

  // Render font metric guides
  const renderMetricGuides = () => {
    if (!fontMetrics || !positioningState.showMetricGuides) return null;

    const baseStrokeWidth = Math.max(2 / zoomState.scale, 0.5);
    const majorStrokeWidth = Math.max(3 / zoomState.scale, 1);

    return (
      <g className="metric-guides" style={{ pointerEvents: "none" }}>
        {/* Background zones - centered coordinate system */}
        {/* Ascender zone (above baseline) */}
        <rect
          x="0" y={fontMetrics.baseline - fontMetrics.ascender}
          width="100%" height={fontMetrics.ascender}
          fill="#fd7e14" fillOpacity="0.05"
          stroke="none"
        />

        {/* Cap Height zone */}
        <rect
          x="0" y={fontMetrics.baseline - fontMetrics.capHeight}
          width="100%" height={fontMetrics.capHeight - fontMetrics.ascender}
          fill="#6f42c1" fillOpacity="0.08"
          stroke="none"
        />

        {/* X-Height zone */}
        <rect
          x="0" y={fontMetrics.baseline - fontMetrics.xHeight}
          width="100%" height={fontMetrics.xHeight - fontMetrics.capHeight}
          fill="#17a2b8" fillOpacity="0.08"
          stroke="none"
        />

        {/* Descender zone (below baseline) */}
        <rect
          x="0" y={fontMetrics.baseline}
          width="100%" height={Math.abs(fontMetrics.descender)}
          fill="#e83e8c" fillOpacity="0.05"
          stroke="none"
        />

        {/* Baseline - Major reference line */}
        <line
          x1="0" y1={fontMetrics.baseline}
          x2="100%" y2={fontMetrics.baseline}
          stroke="#28a745" strokeWidth={majorStrokeWidth}
          strokeDasharray={`${8 / zoomState.scale},${4 / zoomState.scale}`}
          opacity={0.9}
        />

        {/* X-Height */}
        <line
          x1="0" y1={fontMetrics.baseline - fontMetrics.xHeight}
          x2="100%" y2={fontMetrics.baseline - fontMetrics.xHeight}
          stroke="#17a2b8" strokeWidth={baseStrokeWidth}
          strokeDasharray={`${6 / zoomState.scale},${3 / zoomState.scale}`}
          opacity={0.8}
        />

        {/* Cap Height */}
        <line
          x1="0" y1={fontMetrics.baseline - fontMetrics.capHeight}
          x2="100%" y2={fontMetrics.baseline - fontMetrics.capHeight}
          stroke="#6f42c1" strokeWidth={baseStrokeWidth}
          strokeDasharray={`${6 / zoomState.scale},${3 / zoomState.scale}`}
          opacity={0.8}
        />

        {/* Ascender */}
        <line
          x1="0" y1={fontMetrics.baseline - fontMetrics.ascender}
          x2="100%" y2={fontMetrics.baseline - fontMetrics.ascender}
          stroke="#fd7e14" strokeWidth={baseStrokeWidth}
          strokeDasharray={`${4 / zoomState.scale},${2 / zoomState.scale}`}
          opacity={0.7}
        />

        {/* Descender */}
        <line
          x1="0" y1={fontMetrics.baseline + Math.abs(fontMetrics.descender)}
          x2="100%" y2={fontMetrics.baseline + Math.abs(fontMetrics.descender)}
          stroke="#e83e8c" strokeWidth={baseStrokeWidth}
          strokeDasharray={`${4 / zoomState.scale},${2 / zoomState.scale}`}
          opacity={0.7}
        />
      </g>
    );
  };

  // Render metric labels
  const renderMetricLabels = () => {
    if (!fontMetrics || !positioningState.showMetricGuides) return null;

    const fontSize = Math.max(12 / zoomState.scale, 8);
    const labelHeight = Math.max(16 / zoomState.scale, 8);
    const labelOffset = 18 / zoomState.scale;

    return (
      <g className="metric-labels" style={{ pointerEvents: "none" }}>
        {/* Baseline */}
        <g>
          <rect
            x="2" y={fontMetrics.baseline - labelOffset}
            width="60" height={labelHeight}
            fill="#28a745" fillOpacity="0.9"
            rx="2"
          />
          <text x="5" y={fontMetrics.baseline - 5 / zoomState.scale}
            fontSize={fontSize} fill="white" fontWeight="600">
            Baseline
          </text>
        </g>

        {/* X-Height */}
        <g>
          <rect
            x="2" y={fontMetrics.baseline - fontMetrics.xHeight - labelOffset}
            width="70" height={labelHeight}
            fill="#17a2b8" fillOpacity="0.9"
            rx="2"
          />
          <text x="5" y={fontMetrics.baseline - fontMetrics.xHeight - 5 / zoomState.scale}
            fontSize={fontSize} fill="white" fontWeight="600">
            X-Height
          </text>
        </g>

        {/* Cap Height */}
        <g>
          <rect
            x="2" y={fontMetrics.baseline - fontMetrics.capHeight - labelOffset}
            width="80" height={labelHeight}
            fill="#6f42c1" fillOpacity="0.9"
            rx="2"
          />
          <text x="5" y={fontMetrics.baseline - fontMetrics.capHeight - 5 / zoomState.scale}
            fontSize={fontSize} fill="white" fontWeight="600">
            Cap Height
          </text>
        </g>

        {/* Ascender */}
        <g>
          <rect
            x="2" y={fontMetrics.baseline - fontMetrics.ascender - labelOffset}
            width="70" height={labelHeight}
            fill="#fd7e14" fillOpacity="0.9"
            rx="2"
          />
          <text x="5" y={fontMetrics.baseline - fontMetrics.ascender - 5 / zoomState.scale}
            fontSize={fontSize} fill="white" fontWeight="600">
            Ascender
          </text>
        </g>

        {/* Descender */}
        <g>
          <rect
            x="2" y={fontMetrics.baseline + Math.abs(fontMetrics.descender) - labelOffset}
            width="75" height={labelHeight}
            fill="#e83e8c" fillOpacity="0.9"
            rx="2"
          />
          <text x="5" y={fontMetrics.baseline + Math.abs(fontMetrics.descender) - 5 / zoomState.scale}
            fontSize={fontSize} fill="white" fontWeight="600">
            Descender
          </text>
        </g>
      </g>
    );
  };

  // Render node handles
  const renderNodeHandle = (node: SVGPathNode, index: number) => {
    const isSelected = editingState.selectedNodeId === node.id;
    const isHovered = editingState.hoveredNodeId === node.id;
    const isDragging = editingState.dragState.nodeId === node.id;
    const isDeleteMode = editingState.editMode === "delete";

    // Check if this node can be deleted
    const isFirstMoveNode = index === 0 && node.type === "move";
    const cannotDelete = isFirstMoveNode || editableData.nodes.length <= 3;

    const baseRadius = isSelected ? 3 : isHovered ? 1.5 : 1;
    const radius = baseRadius / zoomState.scale; // Adjust size for zoom level

    let fill = "#6c757d";
    let cursor = "grab";

    if (isDeleteMode) {
      if (cannotDelete) {
        fill = "#6c757d"; // Gray for non-deletable nodes
        cursor = "not-allowed";
      } else {
        fill = isHovered ? "#dc3545" : "#ffc107"; // Red when hovered in delete mode, yellow otherwise
        cursor = "pointer";
      }
    } else if (isSelected) {
      fill = "#007bff";
    } else if (isHovered) {
      fill = "#0056b3";
    }

    const baseStrokeWidth = isDragging ? 1 : 0.5;
    const strokeWidth = baseStrokeWidth / zoomState.scale;

    return (
      <g key={`node-${node.id}`}>
        {/* Main node handle */}
        <circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill={fill}
          stroke="white"
          strokeWidth={strokeWidth}
          style={{
            cursor: readOnly ? "default" : cursor,
            filter: isSelected ? "drop-shadow(0 2px 4px rgba(250,250,250,0.3))" : "none"
          }}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onMouseEnter={() => handleNodeMouseEnter(node.id)}
          onMouseLeave={handleNodeMouseLeave}
          onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
        />

        {/* Control point handles for curves */}
        {node.type === "curve" && isSelected && !readOnly && (
          <>
            {node.controlPoint1 && (
              <>
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={node.controlPoint1.x}
                  y2={node.controlPoint1.y}
                  stroke="#007bff"
                  strokeWidth={1 / zoomState.scale}
                  strokeDasharray={`${2 / zoomState.scale},${2 / zoomState.scale}`}
                  opacity={0.7}
                />
                <circle
                  cx={node.controlPoint1.x}
                  cy={node.controlPoint1.y}
                  r={1.5 / zoomState.scale}
                  fill="#007bff"
                  stroke="white"
                  strokeWidth={1 / zoomState.scale}
                  style={{ cursor: "grab" }}
                />
              </>
            )}

            {node.controlPoint2 && (
              <>
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={node.controlPoint2.x}
                  y2={node.controlPoint2.y}
                  stroke="#007bff"
                  strokeWidth={1 / zoomState.scale}
                  strokeDasharray={`${2 / zoomState.scale},${2 / zoomState.scale}`}
                  opacity={0.7}
                />
                <circle
                  cx={node.controlPoint2.x}
                  cy={node.controlPoint2.y}
                  r={1.5 / zoomState.scale}
                  fill="#007bff"
                  stroke="white"
                  strokeWidth={1 / zoomState.scale}
                  style={{ cursor: "grab" }}
                />
              </>
            )}
          </>
        )}

        {/* Node type indicator */}
        {isSelected && (
          <text
            x={node.x}
            y={node.y - 12}
            textAnchor="middle"
            fontSize="10"
            fill="#495057"
            fontFamily="monospace"
          >
            {node.type.charAt(0).toUpperCase()}
          </text>
        )}
      </g>
    );
  };

  // Toolbar for editing modes and zoom controls
  const renderToolbar = () => {
    if (readOnly || editableData.nodes.length === 0) return null;

    return (
      <div className="absolute top-2 left-2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
        {/* Editing Mode Tools */}
        <div className="flex gap-1">
          <button
            onClick={() => setEditingState(prev => ({
              ...prev,
              editMode: "select",
              selectedPathId: null,
              isPathHovered: false
            }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${editingState.editMode === "select"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            title="Select and move nodes (or middle-click drag to pan)"
          >
            Select
          </button>
          <button
            onClick={() => setEditingState(prev => ({
              ...prev,
              editMode: "add",
              selectedPathId: null,
              isPathHovered: false
            }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${editingState.editMode === "add"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            title="Add new nodes"
          >
            Add
          </button>
          <button
            onClick={() => setEditingState(prev => ({
              ...prev,
              editMode: "delete",
              selectedPathId: null,
              isPathHovered: false
            }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${editingState.editMode === "delete"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            title="Delete nodes"
          >
            Delete
          </button>
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-300"></div>

        {/* Move Path Tool */}
        <div className="flex gap-1">
          <button
            onClick={() => setEditingState(prev => ({
              ...prev,
              editMode: "move-path",
              selectedPathId: null,
              isPathHovered: false
            }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${editingState.editMode === "move-path"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            title="Move entire glyph path"
          >
            Move Path
          </button>
          {(editingState.selectedPathId || isDraggingRef.current) && (
            <button
              onClick={forceStopDragging}
              className="p-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Emergency stop - clear all selections and dragging"
            >
              Stop
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-300"></div>

        {/* Zoom Controls */}
        <div className="flex gap-1">
          <button
            onClick={zoomIn}
            className="p-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title="Zoom in"
          >
            Zoom In
          </button>
          <button
            onClick={zoomOut}
            className="p-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title="Zoom out"
          >
            Zoom Out
          </button>
          <button
            onClick={resetZoom}
            className="p-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title="Reset zoom (1:1)"
          >
            Reset
          </button>
          <button
            onClick={zoomToFit}
            className="p-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title="Zoom to fit all nodes"
          >
            Fit
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative bg-white border rounded-lg ${className}`}>
      {/* Toolbar */}
      {renderToolbar()}

      {/* Glyph Positioning Controls */}
      {fontMetrics && (
        <div className="positioning-controls bg-gray-50 border-b p-3">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={positioningState.showMetricGuides}
                  onChange={(e) => setPositioningState(prev => ({ ...prev, showMetricGuides: e.target.checked }))}
                  className="rounded"
                />
                Show Guides
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={positioningState.snapToMetrics}
                  onChange={(e) => setPositioningState(prev => ({ ...prev, snapToMetrics: e.target.checked }))}
                  className="rounded"
                />
                Snap to Metrics
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">
                Path Offset Y:
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={positioningState.pathOffset.y}
                  onChange={(e) => setPositioningState(prev => ({
                    ...prev,
                    pathOffset: { ...prev.pathOffset, y: parseInt(e.target.value) }
                  }))}
                  className="mx-2 w-24"
                />
                <span className="text-xs font-mono">{positioningState.pathOffset.y}</span>
              </label>
            </div>

            <div className="flex gap-4 text-xs text-gray-600">
              <span>Baseline: Y=0</span>
              <span>X-Height: Y={fontMetrics.xHeight}</span>
              <span>Cap Height: Y={fontMetrics.capHeight}</span>
              <span>Ascender: Y={fontMetrics.ascender}</span>
              <span>Descender: Y={fontMetrics.descender}</span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Editor */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ minHeight: "300px" }}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="block"
          style={{
            cursor: isPanningRef.current ? "grabbing" : editingState.editMode === "add" ? "crosshair" : "grab"
          }}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handlePanMove(e);
            // Only handle path drag if we're actively dragging a path
            if (editingState.selectedPathId && isDraggingRef.current) {
              handlePathDrag(e);
            }
          }}
          onMouseUp={() => {
            handleMouseUp();
            handlePanEnd();
          }}
          onMouseLeave={() => {
            handleMouseUp();
            handlePanEnd();
          }}
          onMouseDown={(e) => {
            handlePanStart(e);
            handlePathMouseDown(e);
          }}
          onClick={handlePathClick}
        >
          {/* Grid background for reference */}
          <defs>
            <pattern
              id={`grid-${glyphId}`}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#f1f3f4"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={`url(#grid-${glyphId})`}
            style={{ pointerEvents: 'none' }}
          />

          {/* Transform group for zoom and pan */}
          <g transform={`translate(${zoomState.translateX}, ${zoomState.translateY}) scale(${zoomState.scale})`}>
            {/* Font metric guides */}
            {renderMetricGuides()}
            {renderMetricLabels()}

            {/* Main path */}
            <path
              d={currentPath}
              fill={editingState.selectedPathId ? "#8b5cf6" : editingState.isPathHovered ? "#a855f7" : "currentColor"}
              stroke={editingState.selectedPathId ? "#7c3aed" : editingState.isPathHovered ? "#9333ea" : "#6c757d"}
              strokeWidth={editingState.selectedPathId ? 2 / zoomState.scale : editingState.isPathHovered ? 1.5 / zoomState.scale : 1 / zoomState.scale}
              opacity={editingState.selectedPathId ? 1 : editingState.isPathHovered ? 0.9 : 0.8}
              style={{
                pointerEvents: editingState.editMode === "add" || editingState.editMode === "move-path" ? "all" : "none",
                cursor: editingState.editMode === "move-path" ? (editingState.selectedPathId ? "grabbing" : "grab") : "default"
              }}
              data-interactive={editingState.editMode === "add" || editingState.editMode === "move-path" ? "true" : "false"}
              onMouseEnter={() => {
                if (editingState.editMode === "move-path") {
                  setEditingState(prev => ({ ...prev, isPathHovered: true }));
                }
              }}
              onMouseLeave={() => {
                setEditingState(prev => ({ ...prev, isPathHovered: false }));
              }}
              onMouseDown={handlePathMouseDown}
            />

            {/* Path outline for better visibility */}
            <path
              d={currentPath}
              fill="none"
              stroke="#6c757d"
              strokeWidth={1 / zoomState.scale} // Adjust stroke width for zoom
              opacity={0.5}
              style={{ pointerEvents: "none" }}
            />

            {/* Node handles */}
            {!readOnly && editableData.nodes.map((node, index) => renderNodeHandle(node, index))}
          </g>
        </svg>
      </div>

      {/* Status information */}
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
        {editableData.nodes.length === 0 ? (
          'Path loaded • Preview mode (complex paths not editable)'
        ) : (
          <>
            {editableData.nodes.length} nodes • Mode: {editingState.editMode} • Zoom: {(zoomState.scale * 100).toFixed(0)}%
            {editingState.selectedNodeId && ` • Selected: ${editingState.selectedNodeId}`}
            {editingState.selectedPathId && ` • Path Selected`}
            {positioningState.pathOffset.x !== 0 || positioningState.pathOffset.y !== 0 ? ` • Offset: (${positioningState.pathOffset.x.toFixed(1)}, ${positioningState.pathOffset.y.toFixed(1)})` : ''}
          </>
        )}
      </div>
    </div>
  );
}
