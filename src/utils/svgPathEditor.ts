// SVG Path Editor - Interactive path manipulation utilities
import type { SVGPathNode, EditablePathData } from '@/types';

/**
 * SVG Path Editor class for parsing and manipulating SVG paths
 */
export class SVGPathEditor {
  /**
   * Parse an SVG path string into editable nodes
   */
  static parsePathToNodes(pathString: string): SVGPathNode[] {
    if (!pathString || typeof pathString !== 'string') {
      console.warn('⚠️ Invalid path string provided to parsePathToNodes');
      return [];
    }

    console.log('📝 Parsing SVG path to editable nodes:', pathString.substring(0, 100) + '...');

    const nodes: SVGPathNode[] = [];
    let nodeIdCounter = 0;
    let lastControlPoint: { x: number; y: number } | null = null; // For smooth curves

    try {
      // Split path into commands - handle both uppercase and lowercase
      const commands = pathString.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/i).filter(cmd => cmd.trim());

      for (const commandStr of commands) {
        const trimmed = commandStr.trim();
        if (!trimmed) continue;

        try {
          const command = trimmed[0].toUpperCase();
          const values = trimmed.slice(1)
            .split(/[\s,]+/)
            .filter(v => v && !isNaN(Number(v)))
            .map(Number);

          switch (command) {
            case 'M': // MoveTo
              if (values.length >= 2) {
                nodes.push({
                  id: `node_${nodeIdCounter++}`,
                  type: 'move',
                  x: values[0],
                  y: values[1],
                });
              }
              break;

            case 'L': // LineTo
              if (values.length >= 2) {
                nodes.push({
                  id: `node_${nodeIdCounter++}`,
                  type: 'line',
                  x: values[0],
                  y: values[1],
                });
              }
              break;

            case 'Q': // QuadraticCurveTo
              if (values.length >= 4) {
                nodes.push({
                  id: `node_${nodeIdCounter++}`,
                  type: 'curve',
                  x: values[2],
                  y: values[3],
                  controlPoint1: { x: values[0], y: values[1] },
                });
              }
              break;

            case 'C': // CubicCurveTo
              if (values.length >= 6) {
                nodes.push({
                  id: `node_${nodeIdCounter++}`,
                  type: 'curve',
                  x: values[4],
                  y: values[5],
                  controlPoint1: { x: values[0], y: values[1] },
                  controlPoint2: { x: values[2], y: values[3] },
                });
                // Update last control point for smooth curves
                lastControlPoint = { x: values[2], y: values[3] };
              }
              break;

            case 'S': // SmoothCubicCurveTo
              if (values.length >= 4) {
                // For now, treat S like C (smooth curves not fully implemented)
                // Calculate the first control point by reflecting the last control point
                let controlPoint1 = lastControlPoint;
                if (!controlPoint1) {
                  // If no previous control point, mirror the second control point
                  controlPoint1 = { x: 2 * values[2] - values[0], y: 2 * values[3] - values[1] };
                }

                nodes.push({
                  id: `node_${nodeIdCounter++}`,
                  type: 'curve',
                  x: values[2],
                  y: values[3],
                  controlPoint1: controlPoint1,
                  controlPoint2: { x: values[0], y: values[1] },
                });
                // Update last control point for smooth curves
                lastControlPoint = { x: values[0], y: values[1] };
              }
              break;

            case 'Z': // ClosePath
              nodes.push({
                id: `node_${nodeIdCounter++}`,
                type: 'close',
                x: 0,
                y: 0,
              });
              break;

            default:
              console.warn(`⚠️ Unsupported path command: ${command}`);
          }
        } catch (commandError) {
          console.error(`❌ Error parsing command "${trimmed}":`, commandError);
          // Continue with next command
        }
      }

      console.log(`✅ Parsed ${nodes.length} nodes from path`);
      return nodes;
    } catch (error) {
      console.error('❌ Error parsing SVG path:', error);
      return [];
    }
  }

  /**
   * Convert editable nodes back to SVG path string
   */
  static nodesToPathString(nodes: SVGPathNode[]): string {
    if (!nodes || nodes.length === 0) {
      console.warn('⚠️ No nodes provided to nodesToPathString');
      return '';
    }

    console.log(`🔧 Converting ${nodes.length} nodes to path string`);

    try {
      const pathCommands: string[] = [];

      for (const node of nodes) {
        switch (node.type) {
          case 'move':
            pathCommands.push(`M ${node.x.toFixed(1)} ${node.y.toFixed(1)}`);
            break;

          case 'line':
            pathCommands.push(`L ${node.x.toFixed(1)} ${node.y.toFixed(1)}`);
            break;

          case 'curve':
            if (node.controlPoint1 && node.controlPoint2) {
              // Cubic curve
              pathCommands.push(
                `C ${node.controlPoint1.x.toFixed(1)} ${node.controlPoint1.y.toFixed(1)} ` +
                `${node.controlPoint2.x.toFixed(1)} ${node.controlPoint2.y.toFixed(1)} ` +
                `${node.x.toFixed(1)} ${node.y.toFixed(1)}`
              );
            } else if (node.controlPoint1) {
              // Quadratic curve
              pathCommands.push(
                `Q ${node.controlPoint1.x.toFixed(1)} ${node.controlPoint1.y.toFixed(1)} ` +
                `${node.x.toFixed(1)} ${node.y.toFixed(1)}`
              );
            } else {
              // Fallback to line
              pathCommands.push(`L ${node.x.toFixed(1)} ${node.y.toFixed(1)}`);
            }
            break;

          case 'close':
            pathCommands.push('Z');
            break;

          default:
            console.warn(`⚠️ Unknown node type: ${node.type}`);
        }
      }

      const pathString = pathCommands.join(' ');
      console.log(`✅ Generated path string: ${pathString.substring(0, 100)}...`);
      return pathString;
    } catch (error) {
      console.error('❌ Error converting nodes to path string:', error);
      return '';
    }
  }

  /**
   * Add a new node at the specified position after the given node
   */
  static addNode(
    nodes: SVGPathNode[],
    position: { x: number; y: number },
    afterNodeId: string
  ): SVGPathNode[] {
    console.log(`➕ Adding node at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}) after ${afterNodeId}`);

    try {
      const afterIndex = nodes.findIndex(node => node.id === afterNodeId);
      if (afterIndex === -1) {
        console.warn(`⚠️ Node with ID ${afterNodeId} not found`);
        return nodes;
      }

      const newNode: SVGPathNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'line', // Default to line, can be changed by user
        x: position.x,
        y: position.y,
      };

      const newNodes = [...nodes];
      newNodes.splice(afterIndex + 1, 0, newNode);

      console.log(`✅ Added node ${newNode.id} at index ${afterIndex + 1}`);
      return newNodes;
    } catch (error) {
      console.error('❌ Error adding node:', error);
      return nodes;
    }
  }

  /**
   * Remove a node and adjust neighboring connections
   */
  static removeNode(nodes: SVGPathNode[], nodeId: string): { nodes: SVGPathNode[], success: boolean, message?: string } {
    console.log(`🗑️ Removing node ${nodeId}`);

    try {
      const nodeIndex = nodes.findIndex(node => node.id === nodeId);
      if (nodeIndex === -1) {
        console.warn(`⚠️ Node with ID ${nodeId} not found`);
        return {
          nodes,
          success: false,
          message: "Node not found"
        };
      }

      const nodeToRemove = nodes[nodeIndex];

      // Don't allow removal of move commands or if it would break the path
      if (nodeToRemove.type === 'move' && nodeIndex === 0) {
        console.warn('⚠️ Cannot remove the first move command');
        return {
          nodes,
          success: false,
          message: "Cannot delete the starting point of the path"
        };
      }

      // Check if removing this node would leave too few nodes for a valid shape
      if (nodes.length <= 3) {
        return {
          nodes,
          success: false,
          message: "Cannot delete - minimum 3 nodes required for a valid shape"
        };
      }

      const newNodes = nodes.filter(node => node.id !== nodeId);
      console.log(`✅ Removed node ${nodeId}, ${newNodes.length} nodes remaining`);
      return {
        nodes: newNodes,
        success: true,
        message: `Successfully removed node`
      };
    } catch (error) {
      console.error('❌ Error removing node:', error);
      return {
        nodes,
        success: false,
        message: "Error occurred while removing node"
      };
    }
  }

  /**
   * Move a node to a new position and maintain curve continuity
   */
  static moveNode(
    nodes: SVGPathNode[],
    nodeId: string,
    newPosition: { x: number; y: number }
  ): SVGPathNode[] {
    console.log(`📍 Moving node ${nodeId} to (${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(1)})`);

    try {
      const nodeIndex = nodes.findIndex(node => node.id === nodeId);
      if (nodeIndex === -1) {
        console.warn(`⚠️ Node with ID ${nodeId} not found`);
        return nodes;
      }

      const newNodes = [...nodes];
      const node = { ...newNodes[nodeIndex] };

      // Calculate the movement delta
      const deltaX = newPosition.x - node.x;
      const deltaY = newPosition.y - node.y;

      // Update node position
      node.x = newPosition.x;
      node.y = newPosition.y;

      // For curve nodes, also move control points to maintain relative positions
      if (node.type === 'curve') {
        if (node.controlPoint1) {
          node.controlPoint1 = {
            x: node.controlPoint1.x + deltaX,
            y: node.controlPoint1.y + deltaY,
          };
        }
        if (node.controlPoint2) {
          node.controlPoint2 = {
            x: node.controlPoint2.x + deltaX,
            y: node.controlPoint2.y + deltaY,
          };
        }
      }

      newNodes[nodeIndex] = node;
      console.log(`✅ Moved node ${nodeId}`);
      return newNodes;
    } catch (error) {
      console.error('❌ Error moving node:', error);
      return nodes;
    }
  }

  /**
   * Create EditablePathData from an SVG path string
   */
  static createEditablePathData(
    pathString: string,
    viewBox: { width: number; height: number; x?: number; y?: number } = { width: 200, height: 200 }
  ): EditablePathData {
    console.log('🔧 Creating editable path data from SVG path');

    const nodes = SVGPathEditor.parsePathToNodes(pathString);

    return {
      nodes,
      viewBox: {
        width: viewBox.width,
        height: viewBox.height,
        x: viewBox.x || 0,
        y: viewBox.y || 0,
      },
      originalPath: pathString,
    };
  }

  /**
   * Simplify path by removing redundant nodes
   */
  static simplifyPath(nodes: SVGPathNode[], tolerance: number = 1.0): SVGPathNode[] {
    console.log(`🎯 Simplifying path with ${nodes.length} nodes (tolerance: ${tolerance})`);

    if (nodes.length <= 3) {
      return nodes; // Can't simplify paths with too few nodes
    }

    const simplified: SVGPathNode[] = [];

    // Always keep the first node
    simplified.push(nodes[0]);

    for (let i = 1; i < nodes.length - 1; i++) {
      const prevNode = nodes[i - 1];
      const currentNode = nodes[i];
      const nextNode = nodes[i + 1];

      // Always keep move commands and curve commands
      if (currentNode.type === 'move' || currentNode.type === 'curve' || currentNode.type === 'close') {
        simplified.push(currentNode);
        continue;
      }

      // For line nodes, check if they're on the same line as neighbors
      if (currentNode.type === 'line') {
        const distance1 = Math.sqrt(
          Math.pow(currentNode.x - prevNode.x, 2) + Math.pow(currentNode.y - prevNode.y, 2)
        );
        const distance2 = Math.sqrt(
          Math.pow(nextNode.x - currentNode.x, 2) + Math.pow(nextNode.y - currentNode.y, 2)
        );

        // If the node is too close to its neighbors, skip it
        if (distance1 < tolerance && distance2 < tolerance) {
          console.log(`🗑️ Removing redundant node ${currentNode.id} (too close to neighbors)`);
          continue;
        }
      }

      simplified.push(currentNode);
    }

    // Always keep the last node
    simplified.push(nodes[nodes.length - 1]);

    console.log(`✅ Simplified from ${nodes.length} to ${simplified.length} nodes`);
    return simplified;
  }

  /**
   * Convert node type (e.g., line to curve)
   */
  static convertNodeType(
    nodes: SVGPathNode[],
    nodeId: string,
    newType: SVGPathNode['type']
  ): SVGPathNode[] {
    console.log(`🔄 Converting node ${nodeId} to type ${newType}`);

    try {
      const nodeIndex = nodes.findIndex(node => node.id === nodeId);
      if (nodeIndex === -1) {
        console.warn(`⚠️ Node with ID ${nodeId} not found`);
        return nodes;
      }

      const newNodes = [...nodes];
      const node = { ...newNodes[nodeIndex] };
      const oldType = node.type;

      // Convert the node type
      node.type = newType;

      // Handle type-specific properties
      if (newType === 'curve' && oldType !== 'curve') {
        // Adding curve properties - create default control points
        const prevNode = nodeIndex > 0 ? nodes[nodeIndex - 1] : null;
        const nextNode = nodeIndex < nodes.length - 1 ? nodes[nodeIndex + 1] : null;

        if (prevNode) {
          // Create control point between previous and current node
          node.controlPoint1 = {
            x: (prevNode.x + node.x) / 2,
            y: (prevNode.y + node.y) / 2,
          };
        }

        if (nextNode) {
          // Create second control point toward next node
          node.controlPoint2 = {
            x: (node.x + nextNode.x) / 2,
            y: (node.y + nextNode.y) / 2,
          };
        }
      } else if (newType !== 'curve' && oldType === 'curve') {
        // Removing curve properties
        delete node.controlPoint1;
        delete node.controlPoint2;
      }

      newNodes[nodeIndex] = node;
      console.log(`✅ Converted node ${nodeId} from ${oldType} to ${newType}`);
      return newNodes;
    } catch (error) {
      console.error('❌ Error converting node type:', error);
      return nodes;
    }
  }

  /**
   * Smooth a section of the path by converting line segments to curves
   */
  static smoothPath(nodes: SVGPathNode[], startNodeId?: string, endNodeId?: string): SVGPathNode[] {
    console.log('🌊 Smoothing path section');

    try {
      const startIndex = startNodeId ? nodes.findIndex(n => n.id === startNodeId) : 0;
      const endIndex = endNodeId ? nodes.findIndex(n => n.id === endNodeId) : nodes.length - 1;

      if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        console.warn('⚠️ Invalid smoothing range');
        return nodes;
      }

      const newNodes = [...nodes];

      // Convert line segments to smooth curves
      for (let i = startIndex; i <= endIndex; i++) {
        const node = newNodes[i];
        if (node.type === 'line' && i > 0 && i < newNodes.length - 1) {
          newNodes[i] = SVGPathEditor.convertNodeType(newNodes, node.id, 'curve')[i];
        }
      }

      console.log(`✅ Smoothed path section from index ${startIndex} to ${endIndex}`);
      return newNodes;
    } catch (error) {
      console.error('❌ Error smoothing path:', error);
      return nodes;
    }
  }
}

/**
 * Utility functions for path editing
 */

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

/**
 * Find the closest node to a given point
 */
export function findClosestNode(
  nodes: SVGPathNode[],
  point: { x: number; y: number },
  maxDistance: number = 10
): SVGPathNode | null {
  let closestNode: SVGPathNode | null = null;
  let closestDistance = maxDistance;

  for (const node of nodes) {
    const distance = calculateDistance(point, { x: node.x, y: node.y });
    if (distance < closestDistance) {
      closestDistance = distance;
      closestNode = node;
    }
  }

  return closestNode;
}

/**
 * Calculate bounding box of nodes
 */
export function calculateNodesBounds(nodes: SVGPathNode[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);

    // Also consider control points for curves
    if (node.controlPoint1) {
      minX = Math.min(minX, node.controlPoint1.x);
      minY = Math.min(minY, node.controlPoint1.y);
      maxX = Math.max(maxX, node.controlPoint1.x);
      maxY = Math.max(maxY, node.controlPoint1.y);
    }
    if (node.controlPoint2) {
      minX = Math.min(minX, node.controlPoint2.x);
      minY = Math.min(minY, node.controlPoint2.y);
      maxX = Math.max(maxX, node.controlPoint2.x);
      maxY = Math.max(maxY, node.controlPoint2.y);
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

