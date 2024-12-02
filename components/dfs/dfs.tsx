import React, { useState, useEffect, useRef } from 'react';
import './dfs.styles.css';

const DFSVisualizer = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [visited, setVisited] = useState(new Set());
  const [currentPath, setCurrentPath] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [nodeCount, setNodeCount] = useState(6);
  const [startNode, setStartNode] = useState(0);
  const [newEdge, setNewEdge] = useState({ from: '', to: '' });
  const [error, setError] = useState('');
  const [draggingNode, setDraggingNode] = useState(null);
  const svgRef = useRef(null);
  const [adjacencyList, setAdjacencyList] = useState({});
  const runningRef = useRef(false);

  // Generate nodes in a circular layout
  const generateNodes = () => {
    const newNodes = [];
    const radius = 150;
    const centerX = 200;
    const centerY = 200;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i * 2 * Math.PI) / nodeCount;
      newNodes.push({
        id: i,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    setNodes(newNodes);
    setEdges([]);
    setAdjacencyList({});
    setVisited(new Set());
    setCurrentPath([]);
  };

  useEffect(() => {
    generateNodes();
  }, [nodeCount]);

  // Handle node dragging
  const handleMouseDown = (nodeId, e) => {
    if (isRunning) return;
    setDraggingNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (draggingNode === null || isRunning) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes(nodes.map((node) =>
      node.id === draggingNode
        ? { ...node, x: Math.max(20, Math.min(380, x)), y: Math.max(20, Math.min(380, y)) }
        : node
    ));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNode, nodes]);

  // Add new edge
  const addEdge = () => {
    const from = parseInt(newEdge.from);
    const to = parseInt(newEdge.to);

    if (isNaN(from) || isNaN(to)) {
      setError('Please enter valid numbers');
      return;
    }

    if (from < 0 || to < 0 || from >= nodes.length || to >= nodes.length) {
      setError('Node indices out of range');
      return;
    }

    if (from === to) {
      setError('Self-loops are not allowed');
      return;
    }

    if (edges.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
      setError('Edge already exists');
      return;
    }

    const newEdgeObj = { from, to };
    setEdges(prevEdges => [...prevEdges, newEdgeObj]);
    
    setAdjacencyList(prev => {
      const newList = { ...prev };
      if (!newList[from]) newList[from] = [];
      if (!newList[to]) newList[to] = [];
      newList[from].push(to);
      newList[to].push(from);
      return newList;
    });

    setError('');
    setNewEdge({ from: '', to: '' });
  };

  const removeEdge = (index) => {
    const edgeToRemove = edges[index];
    setEdges(edges.filter((_, i) => i !== index));
    
    setAdjacencyList(prev => {
      const newList = { ...prev };
      newList[edgeToRemove.from] = newList[edgeToRemove.from].filter(n => n !== edgeToRemove.to);
      newList[edgeToRemove.to] = newList[edgeToRemove.to].filter(n => n !== edgeToRemove.from);
      return newList;
    });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // DFS implementation
  const dfs = async (node, visited = new Set(), path = []) => {
    if (!runningRef.current) return;

    visited.add(node);
    path.push(node);
    
    setVisited(new Set(visited));
    setCurrentPath([...path]);
    await sleep(speed);

    const neighbors = adjacencyList[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        await dfs(neighbor, visited, path);
      }
    }
    
    if (runningRef.current) {
      path.pop();
      setCurrentPath([...path]);
      await sleep(speed);
    }
  };

  const startDFS = async () => {
    setIsRunning(true);
    runningRef.current = true;
    setVisited(new Set());
    setCurrentPath([]);
    await dfs(startNode, new Set(), []);
    setIsRunning(false);
    runningRef.current = false;
  };

  const resetVisualization = () => {
    runningRef.current = false;
    setVisited(new Set());
    setCurrentPath([]);
    setIsRunning(false);
  };

  return (
    <div>
      <div className='info'>
      <h1>Depth First Search (DFS) for a Graph</h1>
    <p>
        Depth First Search (DFS) for a graph is similar to Depth First Traversal of a tree. In DFS, we traverse all adjacent 
        vertices one by one. Once we traverse an adjacent vertex, we completely finish the traversal of all vertices reachable 
        through that adjacent vertex before moving to the next adjacent vertex. This process is similar to tree traversal, 
        where we first fully traverse the left subtree before moving to the right subtree. 
    </p>
    <p>
        The key difference is that graphs may contain cycles, meaning a node can be revisited. To avoid processing a node 
        multiple times, a boolean visited array is used.
    </p>

    <h2>Example 1:</h2>
    <p>
        Input: adj = [[1, 2], [0, 2], [0, 1, 3, 4], [2], [2]]
    </p>
    <p>
        Output: 1 2 0 3 4
    </p>
    <p>
        Explanation:
        <ul>
            <li>Start at vertex 1: Mark as visited. Output: 1</li>
            <li>Move to vertex 2: Mark as visited. Output: 2</li>
            <li>Move to vertex 0: Mark as visited. Output: 0 (backtrack to vertex 2)</li>
            <li>Move to vertex 3: Mark as visited. Output: 3 (backtrack to vertex 2)</li>
            <li>Move to vertex 4: Mark as visited. Output: 4 (backtrack to vertex 1)</li>
        </ul>
    </p>

    <h2>Example 2:</h2>
    <p>
        Input: adj = [[2, 3, 1], [0], [0, 4], [0], [2]]
    </p>
    <p>
        Output: 0 2 4 3 1
    </p>
    <p>
        Explanation:
        <ul>
            <li>Start at vertex 0: Mark as visited. Output: 0</li>
            <li>Move to vertex 2: Mark as visited. Output: 2</li>
            <li>Move to vertex 4: Mark as visited. Output: 4 (backtrack to vertex 2, then backtrack to vertex 0)</li>
            <li>Move to vertex 3: Mark as visited. Output: 3 (backtrack to vertex 0)</li>
            <li>Move to vertex 1: Mark as visited. Output: 1</li>
        </ul>
    </p>

    <h2>DFS from a Given Source of Undirected Graph</h2>
    <p>
        The DFS algorithm starts from a given source and explores all reachable vertices. It is similar to Preorder Tree 
        Traversal where we visit the root and recursively visit its children. In graphs, loops may occur, so we use a 
        visited array to ensure that a vertex is not processed more than once.
    </p>

    

    <h3>Time Complexity:</h3>
    <p>O(V + E), where V is the number of vertices and E is the number of edges in the graph.</p>

    <h3>Auxiliary Space:</h3>
    <p>O(V + E), due to the visited array and recursive stack space for DFS.</p>

    <h2>DFS for Complete Traversal of Disconnected Undirected Graph</h2>
    <p>
        The above implementation takes a source as input and only prints the vertices that are reachable from the source. 
        In case of a disconnected graph, it will not print all the vertices. To address this, we call DFS for each non-visited 
        vertex, ensuring that all vertices are visited even in disconnected graphs.
    </p>
      </div>
      <div><div className="dfs-container">
      <div className="controls">
        <div className="control-group">
          <label>Nodes:</label>
          <input
            type="number"
            value={nodeCount}
            onChange={(e) => setNodeCount(Math.max(2, parseInt(e.target.value) || 2))}
            min="2"
          />
        </div>
        <div className="control-group">
          <label>Start Node:</label>
          <input
            type="number"
            value={startNode}
            onChange={(e) => setStartNode(Math.min(Math.max(0, parseInt(e.target.value) || 0), nodeCount - 1))}
            min="0"
            max={nodeCount - 1}
          />
        </div>
        <button
          onClick={generateNodes}
          disabled={isRunning}
          className="btn btn-blue"
        >
          Generate Nodes
        </button>
        <button
          onClick={startDFS}
          disabled={isRunning || nodes.length === 0}
          className="btn btn-green"
        >
          Start DFS
        </button>
        <button
          onClick={resetVisualization}
          disabled={isRunning}
          className="btn btn-yellow"
        >
          Reset
        </button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="speed-select"
        >
          <option value={2000}>Slow</option>
          <option value={1000}>Medium</option>
          <option value={500}>Fast</option>
        </select>
      </div>

      <div className="edge-controls">
        <input
          type="text"
          placeholder="From Node"
          value={newEdge.from}
          onChange={(e) => setNewEdge({...newEdge, from: e.target.value})}
        />
        <input
          type="text"
          placeholder="To Node"
          value={newEdge.to}
          onChange={(e) => setNewEdge({...newEdge, to: e.target.value})}
        />
        <button
          onClick={addEdge}
          disabled={isRunning}
          className="btn btn-purple"
        >
          Add Edge
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="edge-table-container">
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((edge, index) => (
              <tr key={index}>
                <td>{edge.from}</td>
                <td>{edge.to}</td>
                <td>
                  <button
                    onClick={() => removeEdge(index)}
                    disabled={isRunning}
                    className="btn btn-red"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="graph-container">
        <svg ref={svgRef}>
          {edges.map((edge, index) => {
            const fromNode = nodes[edge.from];
            const toNode = nodes[edge.to];
            const isInCurrentPath = currentPath.includes(edge.from) && 
                           currentPath.includes(edge.to) && 
                           Math.abs(currentPath.indexOf(edge.from) - currentPath.indexOf(edge.to)) === 1;
            
            return (
              <line
                key={`edge-${index}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className={isInCurrentPath ? 'edge-active' : 'edge'}
              />
            );
          })}

          {nodes.map((node, index) => (
            <g 
              key={`node-${index}`}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              className="node-group"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                className={`node ${
                  currentPath[currentPath.length - 1] === index
                    ? 'node-current'
                    : visited.has(index)
                    ? 'node-visited'
                    : 'node-default'
                } ${draggingNode === node.id ? 'node-dragging' : ''}`}
              />
              <text
                x={node.x}
                y={node.y}
                className="node-text"
              >
                {index}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div></div>
    </div>
    
  );
};

export default DFSVisualizer;