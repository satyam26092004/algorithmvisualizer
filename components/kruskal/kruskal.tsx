// algorithm/components/kruskal/kruskal.tsx
import React, { useState, useEffect } from 'react';
import './kruskal.style.css'; 
class DisjointSet {
  constructor() {
    this.parent = {};
    this.rank = {};
  }

  makeSet(vertex) {
    this.parent[vertex] = vertex;
    this.rank[vertex] = 0;
  }

  find(vertex) {
    if (this.parent[vertex] !== vertex) {
      this.parent[vertex] = this.find(this.parent[vertex]); // Path compression
    }
    return this.parent[vertex];
  }

  union(vertex1, vertex2) {
    const root1 = this.find(vertex1);
    const root2 = this.find(vertex2);

    if (root1 !== root2) {
      if (this.rank[root1] < this.rank[root2]) {
        this.parent[root1] = root2;
      } else if (this.rank[root1] > this.rank[root2]) {
        this.parent[root2] = root1;
      } else {
        this.parent[root2] = root1;
        this.rank[root1]++;
      }
      return true;
    }
    return false;
  }
}

const KruskalVisualizer = () => {
  const [edges, setEdges] = useState([]);
  const [vertex1, setVertex1] = useState('');
  const [vertex2, setVertex2] = useState('');
  const [weight, setWeight] = useState('');
  const [nodePositions, setNodePositions] = useState({});
  const [mst, setMst] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [draggedNode, setDraggedNode] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  const MAX_EDGES = 15;

  // Generate optimal layout for nodes in a circle
  const generateOptimalLayout = (nodes) => {
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    return nodes.reduce((acc, node, index) => {
      const angle = (index * 2 * Math.PI) / nodes.length;
      acc[node] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
      return acc;
    }, {});
  };

  // Drag handlers
  const handleDragStart = (e, node) => {
    const svgRect = e.target.closest('svg').getBoundingClientRect();
    const offsetX = e.clientX - svgRect.left - nodePositions[node].x;
    const offsetY = e.clientY - svgRect.top - nodePositions[node].y;
    
    setDraggedNode(node);
    setOffset({ x: offsetX, y: offsetY });
  };

  const handleDrag = (e) => {
    if (!draggedNode) return;

    const svgRect = e.target.closest('svg').getBoundingClientRect();
    const x = Math.max(20, Math.min(580, e.clientX - svgRect.left - offset.x));
    const y = Math.max(20, Math.min(380, e.clientY - svgRect.top - offset.y));

    setNodePositions(prev => ({
      ...prev,
      [draggedNode]: { x, y }
    }));
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggedNode) {
        handleDrag(e);
      }
    };

    const handleMouseUp = () => {
      if (draggedNode) {
        handleDragEnd();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNode]);

  const addEdge = () => {
    if (edges.length >= MAX_EDGES) {
      alert(`Maximum of ${MAX_EDGES} edges allowed`);
      return;
    }

    if (!vertex1 || !vertex2 || !weight) return;

    const duplicateEdge = edges.some(
      e => (e.vertex1 === vertex1 && e.vertex2 === vertex2) || 
           (e.vertex1 === vertex2 && e.vertex2 === vertex1)
    );

    if (duplicateEdge) {
      alert('This edge already exists');
      return;
    }

    const newEdge = { vertex1, vertex2, weight: Number(weight) };
    setEdges(prev => [...prev, newEdge]);

    const uniqueNodes = [...new Set([...edges.map(e => e.vertex1), ...edges.map(e => e.vertex2), vertex1, vertex2])];
    if (Object.keys(nodePositions).length !== uniqueNodes.length) {
      setNodePositions(generateOptimalLayout(uniqueNodes));
    }

    setVertex1('');
    setVertex2('');
    setWeight('');
  };

  const runKruskal = async () => {
    setIsAnimating(true);
    setCurrentStep(-1);
    setMst([]);

    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const disjointSet = new DisjointSet();
    const mstSteps = [];

    // Initialize disjoint set
    const vertices = new Set(edges.flatMap(edge => [edge.vertex1, edge.vertex2]));
    vertices.forEach(vertex => disjointSet.makeSet(vertex));

    // Run Kruskal's algorithm
    for (const edge of sortedEdges) {
      if (disjointSet.union(edge.vertex1, edge.vertex2)) {
        mstSteps.push(edge);
        setMst([...mstSteps]);
        setCurrentStep(mstSteps.length - 1);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
      }
    }

    setIsAnimating(false);
  };

  const clearGraph = () => {
    setEdges([]);
    setNodePositions({});
    setMst([]);
    setCurrentStep(-1);
    setIsAnimating(false);
  };

  const uniqueNodes = [...new Set(edges.flatMap(edge => [edge.vertex1, edge.vertex2]))];

  return (
    <div>
      <div className='info'>
      <h1>Kruskal’s Minimum Spanning Tree (MST) Algorithm</h1>
    <p>
        A minimum spanning tree (MST) or minimum weight spanning tree for a weighted, connected, undirected graph is 
        a spanning tree with a weight less than or equal to the weight of every other spanning tree.
    </p>
    <h2>Introduction to Kruskal’s Algorithm:</h2>
    <p>
        Here we will discuss Kruskal’s algorithm to find the MST of a given weighted graph. 
        In Kruskal’s algorithm, sort all edges of the given graph in increasing order. Then it keeps on adding new edges 
        and nodes in the MST if the newly added edge does not form a cycle. It picks the minimum weighted edge at first 
        and the maximum weighted edge at last. Thus we can say that it makes a locally optimal choice in each step in 
        order to find the optimal solution. Hence this is a Greedy Algorithm.
    </p>
    <h3>How to find MST using Kruskal’s Algorithm?</h3>
    <ol>
        <li>Sort all the edges in non-decreasing order of their weight.</li>
        <li>Pick the smallest edge. Check if it forms a cycle with the spanning tree formed so far. If the cycle is not 
            formed, include this edge. Else, discard it.</li>
        <li>Repeat step #2 until there are (V-1) edges in the spanning tree.</li>
    </ol>
    <p>
        Step 2 uses the Union-Find algorithm to detect cycles. We recommend reading the following posts as prerequisites:
    </p>
    <ul>
        <li>Union-Find Algorithm | Set 1 (Detect Cycle in a Graph)</li>
        <li>Union-Find Algorithm | Set 2 (Union By Rank and Path Compression)</li>
    </ul>
    <h3>Illustration:</h3>
    <p>The graph contains 9 vertices and 14 edges. The minimum spanning tree formed will have (9 – 1) = 8 edges.</p>
    <h4>After sorting:</h4>
    <table border="1">
        <thead>
            <tr>
                <th>Weight</th>
                <th>Source</th>
                <th>Destination</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>1</td><td>7</td><td>6</td></tr>
            <tr><td>2</td><td>8</td><td>2</td></tr>
            <tr><td>2</td><td>6</td><td>5</td></tr>
            <tr><td>4</td><td>0</td><td>1</td></tr>
            <tr><td>4</td><td>2</td><td>5</td></tr>
            <tr><td>6</td><td>8</td><td>6</td></tr>
            <tr><td>7</td><td>2</td><td>3</td></tr>
            <tr><td>7</td><td>7</td><td>8</td></tr>
            <tr><td>8</td><td>0</td><td>7</td></tr>
            <tr><td>8</td><td>1</td><td>2</td></tr>
            <tr><td>9</td><td>3</td><td>4</td></tr>
            <tr><td>10</td><td>5</td><td>4</td></tr>
            <tr><td>11</td><td>1</td><td>7</td></tr>
            <tr><td>14</td><td>3</td><td>5</td></tr>
        </tbody>
    </table>
    <h4>Steps:</h4>
    <ol>
        <li>Pick edge 7-6. No cycle is formed, include it.</li>
        <li>Pick edge 8-2. No cycle is formed, include it.</li>
        <li>Pick edge 6-5. No cycle is formed, include it.</li>
        <li>Pick edge 0-1. No cycle is formed, include it.</li>
        <li>Pick edge 2-5. No cycle is formed, include it.</li>
        <li>Pick edge 8-6. Cycle is formed, discard it. Pick edge 2-3: No cycle is formed, include it.</li>
        <li>Pick edge 7-8. Cycle is formed, discard it. Pick edge 0-7. No cycle is formed, include it.</li>
        <li>Pick edge 1-2. Cycle is formed, discard it. Pick edge 3-4. No cycle is formed, include it.</li>
    </ol>
    <p>Since the number of edges included in the MST equals (V – 1), the algorithm stops here.</p>
      </div>
      <div><div className="kruskal-visualizer">
      <h1>Kruskal's Algorithm Visualizer</h1>
      
      {edges.length >= MAX_EDGES && (
        <div className="alert">
          Maximum of {MAX_EDGES} edges reached. Remove existing edges to add new ones.
        </div>
      )}

      <div className="input-container">
        <input 
          placeholder="Vertex 1" 
          value={vertex1} 
          onChange={(e) => setVertex1(e.target.value)}
          className="input-field"
        />
        <input 
          placeholder="Vertex 2" 
          value={vertex2} 
          onChange={(e) => setVertex2(e.target.value)}
          className="input-field"
        />
        <input 
          type="number" 
          placeholder="Weight" 
          value={weight} 
          onChange={(e) => setWeight(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="button-container">
        <button 
          onClick={addEdge} 
          className="button"
          disabled={isAnimating}
        >
          Add Edge
        </button>
        
        <button 
          onClick={runKruskal}
          className="button"
          disabled={isAnimating || edges.length === 0}
        >
          Run Kruskal's Algorithm
        </button>

        <button 
          onClick={clearGraph}
          className="button"
          disabled={isAnimating}
        >
          Clear Graph
        </button>
      </div>

      <div className="animation-speed">
        <label>Animation Speed (ms)</label>
        <input 
          type="range" 
          min="500" 
          max="2000" 
          step="100"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          className="range-input"
        />
      </div>

      <svg width="600" height="400" className="graph-svg">
        {/* Draw edges */}
        {edges.map((edge, index) => {
          const start = nodePositions[edge.vertex1];
          const end = nodePositions[edge.vertex2];
          
          if (!start || !end) return null;
          
          const isInMST = mst.some(
            e => (e.vertex1 === edge.vertex1 && e.vertex2 === edge.vertex2) ||
                 (e.vertex1 === edge.vertex2 && e.vertex2 === edge.vertex1)
          );
          
          return (
            <g key={index}>
              <line 
                x1={start.x} 
                y1={start.y} 
                x2={end.x} 
                y2={end.y} 
                stroke={isInMST ? "green" : "gray"}
                strokeWidth={isInMST ? "3" : "2"}
              />
              <text 
                x={(start.x + end.x) / 2} 
                y={(start.y + end.y) / 2} 
                textAnchor="middle" 
                fontSize="12"
                fill={isInMST ? "green" : "red"}
                style={{padding:'10px'}}
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {/* Draw nodes */}
        {Object.entries(nodePositions).map(([node, pos]) => (
          <g 
            key={node}
            onMouseDown={(e) => handleDragStart(e, node)}
            style={{ cursor: 'grab' }}
          >
            <circle 
              cx={pos.x} 
              cy={pos.y} 
              r="20" 
              fill="blue"
            />
            <text 
              x={pos.x} 
              y={pos.y} 
              textAnchor="middle" 
              dy=".3em" 
              fill="white"
              pointerEvents="none"
            >
              {node}
            </text>
          </g>
        ))}
      </svg>

      {mst.length > 0 && (
        <div className="mst-info">
          <h2>Minimum Spanning Tree</h2>
          <p>
            <strong>Edges in MST:</strong> {mst.map(edge => 
              `(${edge.vertex1}-${edge.vertex2})`
            ).join(', ')}
          </p>
          <p>
            <strong>Total Weight:</strong> {mst.reduce((sum, edge) => sum + edge.weight, 0)}
          </p>
          <p>
            <strong>Current Step:</strong> {currentStep + 1} of {mst.length}
          </p>
        </div>
      )}
    </div></div>
    </div>
  );
};

export default KruskalVisualizer;