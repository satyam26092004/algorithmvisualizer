import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import "./traversal.styles.css";
import levelImage from "/src/assets/level.jpg"; // Adjust the path as necessary

// Binary Tree Node Class (modified to allow duplicate values)
class TreeNode {
  constructor(value, id = null) {
    this.value = value;
    this.left = null;
    this.right = null;
    // Unique identifier to distinguish nodes with same value
    this.id = id || `${value}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Tree Traversal Utility Class
class TreeTraversal {
  static preorder(node, result = [], path = []) {
    if (!node) return { result, path };
    result.push(node.value);
    path.push(node);
    this.preorder(node.left, result, path);
    this.preorder(node.right, result, path);
    return { result, path };
  }

  static inorder(node, result = [], path = []) {
    if (!node) return { result, path };
    this.inorder(node.left, result, path);
    result.push(node.value);
    path.push(node);
    this.inorder(node.right, result, path);
    return { result, path };
  }

  static postorder(node, result = [], path = []) {
    if (!node) return { result, path };
    this.postorder(node.left, result, path);
    this.postorder(node.right, result, path);
    result.push(node.value);
    path.push(node);
    return { result, path };
  }

  static levelOrder(root) {
    if (!root) return { result: [], path: [] };
    const result = [];
    const path = [];
    const queue = [root];

    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node.value);
      path.push(node);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    return { result, path };
  }
}

// Tree Visualization Component with Improved Positioning
const TreeVisualization = ({ root, highlightedNodes, onNodeMove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodePositions, setNodePositions] = useState(new Map());
  const svgRef = useRef(null);

  // Improved Node Positioning Algorithm
  const calculateInitialPositions = useMemo(() => {
    const svgWidth = 800;
    const svgHeight = 400;
    const nodeRadius = 30;
    const horizontalSpacing = 60;
    const verticalSpacing = 100;

    const initialPositions = new Map();

    // Calculate tree depth and width first
    const calculateTreeDimensions = (node) => {
      if (!node) return { depth: 0, width: 0 };

      const leftDimensions = calculateTreeDimensions(node.left);
      const rightDimensions = calculateTreeDimensions(node.right);

      return {
        depth: Math.max(leftDimensions.depth, rightDimensions.depth) + 1,
        width: leftDimensions.width + rightDimensions.width + 1,
      };
    };

    const treeDimensions = calculateTreeDimensions(root);

    // Recursive positioning with adaptive width and centering
    const positionNodes = (node, x, y, level, horizontalOffset = 0) => {
      if (!node) return { x, width: 0 };

      // Calculate horizontal spread based on tree width
      const levelSpread = svgWidth / (treeDimensions.width + 1);

      // Recursively position left subtree
      const leftSubtree = node.left
        ? positionNodes(
            node.left,
            x,
            y + verticalSpacing,
            level + 1,
            -levelSpread / 2
          )
        : { x, width: 0 };

      // Calculate current node's x position
      const currentX = x + horizontalOffset;
      initialPositions.set(node.id, {
        x: Math.max(nodeRadius, Math.min(svgWidth - nodeRadius, currentX)),
        y,
      });

      // Recursively position right subtree
      const rightSubtree = node.right
        ? positionNodes(
            node.right,
            currentX,
            y + verticalSpacing,
            level + 1,
            levelSpread / 2
          )
        : { x: currentX, width: 0 };

      return {
        x: currentX,
        width: leftSubtree.width + rightSubtree.width + 1,
      };
    };

    // Start positioning from the center of the SVG with adaptive spread
    positionNodes(root, svgWidth / 2, 50, 0);
    return initialPositions;
  }, [root]);

  // Update nodePositions when initial positions change
  useEffect(() => {
    setNodePositions(calculateInitialPositions);
  }, [calculateInitialPositions]);

  // Mouse down handler for node dragging
  const handleMouseDown = (e, node) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedNode(node);
  };

  // Mouse move handler for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !draggedNode) return;

    const svg = svgRef.current;
    const svgRect = svg.getBoundingClientRect();

    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    // Update node position
    const newPositions = new Map(nodePositions);
    newPositions.set(draggedNode.id, { x, y });
    setNodePositions(newPositions);

    // Optional: Notify parent component about node movement
    if (onNodeMove) {
      onNodeMove(draggedNode, { x, y });
    }
  };

  // Mouse up handler to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  // Attach global mouse events
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, draggedNode]);

  // Render individual node
  const renderNode = (node) => {
    const position = nodePositions.get(node.id);
    if (!position) return null;

    const nodeRadius = 25;
    const isHighlighted = highlightedNodes.some((n) => n && n.id === node.id);

    return (
      <g key={node.id}>
        {/* Connections to children */}
        {node.left && nodePositions.get(node.left.id) && (
          <line
            x1={position.x}
            y1={position.y + nodeRadius}
            x2={nodePositions.get(node.left.id).x}
            y2={nodePositions.get(node.left.id).y - nodeRadius}
            stroke="#999"
            strokeWidth="2"
          />
        )}
        {node.right && nodePositions.get(node.right.id) && (
          <line
            x1={position.x}
            y1={position.y + nodeRadius}
            x2={nodePositions.get(node.right.id).x}
            y2={nodePositions.get(node.right.id).y - nodeRadius}
            stroke="#999"
            strokeWidth="2"
          />
        )}

        {/* Node circle with drag interaction */}
        <circle
          cx={position.x}
          cy={position.y}
          r={nodeRadius}
          fill={isHighlighted ? "#ff6b6b" : "#4ecdc4"}
          stroke={isHighlighted ? "#ff0000" : "#45b7d1"}
          strokeWidth="3"
          onMouseDown={(e) => handleMouseDown(e, node)}
          style={{ cursor: "move" }}
        />

        {/* Node value text */}
        <text
          x={position.x}
          y={position.y}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="white"
          fontWeight="bold"
          fontSize="16"
          pointerEvents="none"
        >
          {node.value}
        </text>
      </g>
    );
  };

  // Render the entire tree
  const renderTree = () => {
    if (!root) return null;

    const traverseAndRender = (node) => {
      if (!node) return null;
      return (
        <>
          {renderNode(node)}
          {traverseAndRender(node.left)}
          {traverseAndRender(node.right)}
        </>
      );
    };

    return traverseAndRender(root);
  };

  return (
    <svg ref={svgRef} width="100%" height="400" viewBox="0 0 800 400">
      {renderTree()}
    </svg>
  );
};

// Main Traversal Visualizer Component
const TreeTraversalVisualizer = () => {
  const [treeInput, setTreeInput] = useState("");
  const [traversalType, setTraversalType] = useState("preorder");
  const [traversalResult, setTraversalResult] = useState([]);
  const [root, setRoot] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [currentTraversalIndex, setCurrentTraversalIndex] = useState(0);

  // Build tree from comma-separated input
  const buildTree = useCallback((input) => {
    if (!input) return null;

    const values = input.split(",").map((val) => val.trim());
    if (values.length === 0) return null;

    const root = new TreeNode(Number(values[0]));
    const queue = [root];
    let i = 1;

    while (queue.length > 0 && i < values.length) {
      const current = queue.shift();

      // Left child
      if (i < values.length && values[i] !== "null") {
        current.left = new TreeNode(Number(values[i]));
        queue.push(current.left);
      }
      i++;

      // Right child
      if (i < values.length && values[i] !== "null") {
        current.right = new TreeNode(Number(values[i]));
        queue.push(current.right);
      }
      i++;
    }

    return root;
  }, []);

  // Find node by value in the tree
  const findNodeByValue = (node, value) => {
    if (!node) return null;
    if (node.value === value) return node;
    return (
      findNodeByValue(node.left, value) || findNodeByValue(node.right, value)
    );
  };

  // Perform traversal
  const performTraversal = () => {
    const treeRoot = buildTree(treeInput);
    setRoot(treeRoot);
    setCurrentTraversalIndex(0);

    let { result, path } = { result: [], path: [] };
    switch (traversalType) {
      case "preorder":
        ({ result, path } = TreeTraversal.preorder(treeRoot));
        break;
      case "inorder":
        ({ result, path } = TreeTraversal.inorder(treeRoot));
        break;
      case "postorder":
        ({ result, path } = TreeTraversal.postorder(treeRoot));
        break;
      case "levelorder":
        ({ result, path } = TreeTraversal.levelOrder(treeRoot));
        break;
      default:
        result = [];
        path = [];
    }

    setTraversalResult(result);
    setHighlightedNodes(path.slice(0, 1));
  };

  // Step through traversal
  const stepTraversal = () => {
    if (currentTraversalIndex < traversalResult.length - 1) {
      const nextIndex = currentTraversalIndex + 1;
      setCurrentTraversalIndex(nextIndex);

      // Find ALL nodes corresponding to values up to the current index
      const nodesUpToCurrentIndex = traversalResult
        .slice(0, nextIndex + 1)
        .map((val) => {
          // Find ALL nodes with the current value (in case of duplicates)
          const findAllNodesWithValue = (node) => {
            if (!node) return [];
            const matches = [];

            if (node.value === val) {
              matches.push(node);
            }

            return [
              ...matches,
              ...findAllNodesWithValue(node.left),
              ...findAllNodesWithValue(node.right),
            ];
          };

          return findAllNodesWithValue(root);
        })
        .flat() // Flatten the array of node arrays
        .filter((node) => node !== null);

      setHighlightedNodes(nodesUpToCurrentIndex);
    }
  };
  // Handle node movement (optional additional logic can be added here)
  const handleNodeMove = (node, newPosition) => {
    // You can add additional logic here if needed
    console.log(`Node ${node.value} moved to`, newPosition);
  };

  return (
    <div>
      <div className="info">
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.6,
            margin: "20px",
          }}
        >
          <h1 style={{ color: "#2c3e50" }}>
            Tree Traversals: Level Order, Preorder, Inorder, and Postorder
          </h1>
          <p>
            Tree traversal refers to the process of visiting each node in a tree
            data structure, exactly once, in a systematic way. The following are
            the common types of tree traversals:
          </p>

          <h2 style={{ color: "#34495e" }}>1. Level Order Traversal</h2>
          <p>
            In Level Order Traversal, we visit the nodes level by level,
            starting from the root. All nodes at depth <code>d</code> are
            visited before the nodes at depth <code>d+1</code>.
          </p>
          <p>
            <strong>Example:</strong>
          </p>
          <img
            src="/src/assets/level.jpg"
            alt=""
            srcset=""
            style={{ width: "600px", height: "500px" }}
          />
          <p>Output: 1 2 3 4 5 6</p>

          <h2 style={{ color: "#34495e" }}>2. Preorder Traversal</h2>
          <p>
            In Preorder Traversal, the nodes are visited in the following order:
            <ul style={{ marginLeft: "20px" }}>
              <li>Visit the root node.</li>
              <li>Traverse the left subtree in preorder.</li>
              <li>Traverse the right subtree in preorder.</li>
            </ul>
          </p>
          <p>
            <strong>Example:</strong>
          </p>
          <img
            src="/src/assets/preorder.jpg"
            alt=""
            srcset=""
            style={{ width: "600px", height: "500px" }}
          />

          <p>Output: 1 2 4 5 3 6</p>

          <h2 style={{ color: "#34495e" }}>3. Inorder Traversal</h2>
          <p>
            In Inorder Traversal, the nodes are visited in the following order:
            <ul style={{ marginLeft: "20px" }}>
              <li>Traverse the left subtree in inorder.</li>
              <li>Visit the root node.</li>
              <li>Traverse the right subtree in inorder.</li>
            </ul>
          </p>
          <p>
            <strong>Example:</strong>
          </p>
          <img
            src="/src/assets/inorder.jpg"
            alt=""
            srcset=""
            style={{ width: "600px", height: "500px" }}
          />

          <pre> Output: 4 2 5 1 3 6</pre>

          <h2 style={{ color: "#34495e" }}>4. Postorder Traversal</h2>
          <p>
            In Postorder Traversal, the nodes are visited in the following
            order:
            <ul style={{ marginLeft: "20px" }}>
              <li>Traverse the left subtree in postorder.</li>
              <li>Traverse the right subtree in postorder.</li>
              <li>Visit the root node.</li>
            </ul>
          </p>
          <p>
            <strong>Example:</strong>
          </p>
          <img
            src="/src/assets/postorder.jpg"
            alt=""
            srcset=""
            style={{ width: "600px", height: "500px" }}
          />
          <pre>Output: 4 5 2 6 3 1</pre>

          <h2 style={{ color: "#34495e" }}>Summary of Traversal Orders</h2>
          <table>
            <thead>
              <tr
                style={{
                  backgroundColor: "#34495e",
                  color: "#fff",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "10px" }}>Traversal Type</th>
                <th style={{ padding: "10px" }}>Order</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: "#ecf0f1" }}>
                <td style={{ padding: "10px" }}>Level Order</td>
                <td style={{ padding: "10px" }}>1 2 3 4 5 6</td>
              </tr>
              <tr>
                <td style={{ padding: "10px" }}>Preorder</td>
                <td style={{ padding: "10px" }}>1 2 4 5 3 6</td>
              </tr>
              <tr style={{ backgroundColor: "#ecf0f1" }}>
                <td style={{ padding: "10px" }}>Inorder</td>
                <td style={{ padding: "10px" }}>4 2 5 1 3 6</td>
              </tr>
              <tr>
                <td style={{ padding: "10px" }}>Postorder</td>
                <td style={{ padding: "10px" }}>4 5 2 6 3 1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="tree-traversal-container">
          <h2 className="tree-traversal-title">Tree Traversal Visualizer</h2>

          <div className="tree-input-section">
            <label className="tree-input-label">
              Tree Input (Comma-separated, use 'null' for empty nodes)
            </label>
            <input
              type="text"
              placeholder="e.g., 1,2,3,null,4,5,6. Avoid duplicate nodes"
              value={treeInput}
              onChange={(e) => setTreeInput(e.target.value)}
              className="tree-input-field"
            />
            <p className="tree-input-hint">
              Enter values level by level, left to right. 'null' represents
              empty nodes.
            </p>
          </div>

          <div className="traversal-type-section">
            <label className="traversal-type-label">Traversal Type</label>
            <select
              value={traversalType}
              onChange={(e) => setTraversalType(e.target.value)}
              className="traversal-type-select"
            >
              <option value="preorder">Preorder (Root, Left, Right)</option>
              <option value="inorder">Inorder (Left, Root, Right)</option>
              <option value="postorder">Postorder (Left, Right, Root)</option>
              <option value="levelorder">Level Order (Breadth-First)</option>
            </select>
          </div>

          <div className="button-group">
            <button
              onClick={performTraversal}
              className="traverse-button"
              disabled={!treeInput}
            >
              Initialize Traversal
            </button>
            <button
              onClick={stepTraversal}
              className="step-button"
              disabled={
                !traversalResult.length ||
                currentTraversalIndex >= traversalResult.length - 1
              }
            >
              Step Traverse
            </button>
          </div>

          {root && (
            <div className="tree-visualization-container">
              <TreeVisualization
                root={root}
                highlightedNodes={highlightedNodes}
                onNodeMove={handleNodeMove}
              />
            </div>
          )}

          {traversalResult.length > 0 && (
            <div className="traversal-result-container">
              <h3 className="traversal-result-title">
                {traversalType.charAt(0).toUpperCase() + traversalType.slice(1)}{" "}
                Traversal Result:
              </h3>
              <p className="traversal-result-text">
                {traversalResult
                  .slice(0, currentTraversalIndex + 1)
                  .join(" → ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeTraversalVisualizer;
