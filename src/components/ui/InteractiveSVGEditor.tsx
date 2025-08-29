import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SVGPathNode, EditablePathData, PathEditingState } from '@/types';
import { SVGPathEditor, findClosestNode } from '@/utils/svgPathEditor';

export interface InteractiveSVGEditorProps {
  glyphId: string;
  initialPath: string;
  onPathChanged: (newPath: string) => void;
  viewBox?: { width: number; height: number };
  readOnly?: boolean;
  className?: string;
}

export function InteractiveSVGEditor({
  glyphId,
  initialPath,
  onPathChanged,
  viewBox = { width: 200, height: 200 },
  readOnly = false,
  className = "",
}: InteractiveSVGEditorProps) {
  // State management
  const [editableData, setEditableData] = useState<EditablePathData>(() =>
    SVGPathEditor.createEditablePathData(initialPath, viewBox)
  );
  
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

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });

  // Update editable data when initial path changes
  useEffect(() => {
    const newEditableData = SVGPathEditor.createEditablePathData(initialPath, viewBox);
    setEditableData(newEditableData);
  }, [initialPath, viewBox]);

  // Generate current path string and notify parent of changes
  const currentPath = SVGPathEditor.nodesToPathString(editableData.nodes);
  
  useEffect(() => {
    if (currentPath !== initialPath && !readOnly) {
      onPathChanged(currentPath);
    }
  }, [currentPath, initialPath, onPathChanged, readOnly]);

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
    
    // Update node position
    const newNodes = SVGPathEditor.moveNode(
      editableData.nodes,
      editingState.dragState.nodeId,
      svgCoords
    );
    
    setEditableData(prev => ({
      ...prev,
      nodes: newNodes,
    }));
  }, [readOnly, editableData.nodes, editingState.dragState.nodeId, screenToSVG]);

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

  // Handle path click to add new nodes
  const handlePathClick = useCallback((event: React.MouseEvent) => {
    if (readOnly || editingState.editMode !== "add") return;
    
    const svgCoords = screenToSVG(event.clientX, event.clientY);
    
    // Find closest node to insert after
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
    if (editingState.editMode !== "select" || event.button !== 1) return; // Middle mouse button
    
    event.preventDefault();
    isPanningRef.current = true;
    lastPanPosition.current = { x: event.clientX, y: event.clientY };
  }, [editingState.editMode]);

  // Handle pan move
  const handlePanMove = useCallback((event: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    
    const deltaX = event.clientX - lastPanPosition.current.x;
    const deltaY = event.clientY - lastPanPosition.current.y;
    
    setZoomState(prev => ({
      ...prev,
      translateX: prev.translateX + deltaX,
      translateY: prev.translateY + deltaY,
    }));
    
    lastPanPosition.current = { x: event.clientX, y: event.clientY };
  }, []);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    isPanningRef.current = false;
  }, []);

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
    if (readOnly) return null;
    
    return (
      <div className="absolute top-2 left-2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
        {/* Editing Mode Tools */}
        <div className="flex gap-1">
          <button
            onClick={() => setEditingState(prev => ({ ...prev, editMode: "select" }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${
              editingState.editMode === "select"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Select and move nodes (or middle-click drag to pan)"
          >
            Select
          </button>
          <button
            onClick={() => setEditingState(prev => ({ ...prev, editMode: "add" }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${
              editingState.editMode === "add"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Add new nodes"
          >
            Add
          </button>
          <button
            onClick={() => setEditingState(prev => ({ ...prev, editMode: "delete" }))}
            className={`p-2 rounded text-sm font-medium transition-colors ${
              editingState.editMode === "delete"
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
            cursor: isPanningRef.current ? "grabbing" : editingState.editMode === "add" ? "crosshair" : "default"
          }}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handlePanMove(e);
          }}
          onMouseUp={() => {
            handleMouseUp();
            handlePanEnd();
          }}
          onMouseLeave={() => {
            handleMouseUp();
            handlePanEnd();
          }}
          onMouseDown={handlePanStart}
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
          />
          
          {/* Transform group for zoom and pan */}
          <g transform={`translate(${zoomState.translateX}, ${zoomState.translateY}) scale(${zoomState.scale})`}>
            {/* Main path */}
            <path
              d={currentPath}
              fill="currentColor"
              stroke="none"
              opacity={0.8}
              style={{ pointerEvents: editingState.editMode === "add" ? "all" : "none" }}
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
        {editableData.nodes.length} nodes • Mode: {editingState.editMode} • Zoom: {(zoomState.scale * 100).toFixed(0)}%
        {editingState.selectedNodeId && ` • Selected: ${editingState.selectedNodeId}`}
      </div>
    </div>
  );
}
