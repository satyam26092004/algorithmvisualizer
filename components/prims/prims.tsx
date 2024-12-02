import React, { useState, useEffect, useRef } from 'react';
import './prims.styles.css';

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

interface NewEdge {
  from: string;
  to: string;
  weight: string;
}

const GraphVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<Set<number>>(new Set());
  const [mstEdges, setMstEdges] = useState<Edge[]>([]);
  const [isDirected, setIsDirected] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const [nodeCount, setNodeCount] = useState<number>(5);
  const [newEdge, setNewEdge] = useState<NewEdge>({ from: '', to: '', weight: '' });
  const [error, setError] = useState<string>('');
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate nodes in a circular layout
  const generateNodes = (): void => {
    const newNodes: Node[] = [];
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
    setMstEdges([]);
    setVisitedNodes(new Set());
  };

  // Handle node dragging
  const handleMouseDown = (nodeId: number, e: React.MouseEvent): void => {
    console.log(e);
    if (isRunning) return;
    setDraggingNode(nodeId);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (draggingNode === null || isRunning || !svgRef.current) return;

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

  const handleMouseUp = (): void => {
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
  const addEdge = (): void => {
    const from = parseInt(newEdge.from);
    const to = parseInt(newEdge.to);
    const weight = parseFloat(newEdge.weight);

    if (isNaN(from) || isNaN(to) || isNaN(weight)) {
      setError('Please enter valid numbers');
      return;
    }

    if (from < 0 || to < 0 || from >= nodes.length || to >= nodes.length) {
      setError('Node indices out of range');
      return;
    }

    if (weight <= 0) {
      setError('Weight must be positive');
      return;
    }

    const newEdgeObj: Edge = { from, to, weight };
    setEdges([...edges, newEdgeObj]);
    setError('');
    setNewEdge({ from: '', to: '', weight: '' });
  };

  // Remove edge
  const removeEdge = (index: number): void => {
    setEdges(edges.filter((_, i) => i !== index));
  };

  // Calculate arrow points for directed edges
  const calculateArrowPoints = (x1: number, y1: number, x2: number, y2: number): string => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 15;
    
    const endX = x2 - 20 * Math.cos(angle);
    const endY = y2 - 20 * Math.sin(angle);
    
    const point1X = endX - arrowLength * Math.cos(angle - Math.PI/6);
    const point1Y = endY - arrowLength * Math.sin(angle - Math.PI/6);
    const point2X = endX - arrowLength * Math.cos(angle + Math.PI/6);
    const point2Y = endY - arrowLength * Math.sin(angle + Math.PI/6);
    
    return `${endX},${endY} ${point1X},${point1Y} ${point2X},${point2Y}`;
  };

  // Run Prim's algorithm
  const runPrims = async (): Promise<void> => {
    if (nodes.length === 0 || edges.length === 0) return;
    setIsRunning(true);
    const visited = new Set<number>([0]);
    const newMstEdges: Edge[] = [];
    setVisitedNodes(visited);
    
    const adjMatrix: number[][] = Array(nodes.length).fill(null).map(() => 
      Array(nodes.length).fill(Infinity)
    );
    
    edges.forEach(edge => {
      adjMatrix[edge.from][edge.to] = edge.weight;
      if (!isDirected) {
        adjMatrix[edge.to][edge.from] = edge.weight;
      }
    });

    while (visited.size < nodes.length) {
      let minEdge: Edge | null = null;
      let minWeight = Infinity;

      for (const visitedNode of visited) {
        for (let i = 0; i < nodes.length; i++) {
          if (!visited.has(i) && adjMatrix[visitedNode][i] < minWeight) {
            minWeight = adjMatrix[visitedNode][i];
            minEdge = { from: visitedNode, to: i, weight: adjMatrix[visitedNode][i] };
          }
        }
      }

      if (minEdge) {
        visited.add(minEdge.to);
        newMstEdges.push(minEdge);
        setVisitedNodes(new Set(visited));
        setMstEdges([...newMstEdges]);
        await new Promise(resolve => setTimeout(resolve, speed));
      } else {
        break;
      }
    }
    setIsRunning(false);
  };

  return (
    <div>
      <div className='info'>
      <h1>Prim’s Algorithm for Minimum Spanning Tree (MST)</h1>

<p>Prim’s algorithm is a <strong>greedy</strong> algorithm used to find the Minimum Spanning Tree (MST) of a graph. The algorithm always starts with a single node and expands the MST by adding the minimum weight edge that connects a vertex in the MST to a vertex outside the MST.</p>

<h2>Steps in Prim's Algorithm:</h2>

<ol>
  <li><strong>Initialization:</strong>
    <ul>
      <li>Choose an arbitrary vertex as the starting point (root of the MST).</li>
      <li>Create a set <code>mstSet</code> to keep track of the vertices already included in the MST.</li>
      <li>Assign a <code>key</code> value of 0 to the starting vertex and <code>infinity</code> to all other vertices.</li>
    </ul>
  </li>

  <li><strong>Main Loop:</strong>
    <ul>
      <li>While there are vertices not yet included in the MST, perform the following:</li>
      <li>Pick a vertex <code>u</code> not yet in the MST with the smallest <code>key</code> value.</li>
      <li>Add <code>u</code> to <code>mstSet</code>.</li>
      <li>Update the key values of all adjacent vertices of <code>u</code>. If an adjacent vertex <code>v</code> is not in the MST and the weight of the edge <code>(u, v)</code> is smaller than the current key value of <code>v</code>, update the key value.</li>
    </ul>
  </li>

  <li><strong>Termination:</strong>
    <ul>
      <li>When all vertices are included in the MST, the algorithm terminates.</li>
    </ul>
  </li>
</ol>



<h3>Step-by-Step Execution:</h3>
<ol>
  <li><strong>Step 1:</strong> Start with an arbitrary vertex, say <code>0</code>. Set the key of vertex <code>0</code> to 0 and all others to infinity. Add vertex <code>0</code> to <code>mstSet</code>.</li>
  <li><strong>Step 2:</strong> The available edges are <code>(0, 1)</code> with weight 4 and <code>(0, 7)</code> with weight 7. Pick <code>(0, 1)</code> because it has the minimum weight. Add vertex <code>1</code> to <code>mstSet</code>.</li>
  <li><strong>Step 3:</strong> Now, the available edges are <code>(1, 2)</code> with weight 8, <code>(0, 7)</code> with weight 7. Since <code>(0, 7)</code> has already been added to <code>mstSet</code>, pick <code>(1, 2)</code>. Add vertex <code>2</code> to <code>mstSet</code>.</li>
  <li><strong>Step 4:</strong> The available edges are <code>(1, 2)</code>, <code>(2, 3)</code> with weight 9, and <code>(2, 5)</code> with weight 10. Pick <code>(1, 2)</code>. Add vertex <code>2</code> to <code>mstSet</code>.</li>
  <li><strong>Step 5:</strong> The available edges are <code>(3, 4)</code> with weight 12. Pick <code>(3, 4)</code>.</li>
</ol>
      </div>
      <div>
      <div className="graph-visualizer">
        <h1>Prim's Visualizer</h1>
      <div className="controls">
        <div className="control-group">
          <label>Nodes:</label>
          <input
            type="number"
            value={nodeCount}
            onChange={(e) => setNodeCount(Math.max(2, parseInt(e.target.value) || 2))}
            className="input-number"
            min="2"
          />
        </div>
        <button
          onClick={generateNodes}
          disabled={isRunning}
          className="button button-blue"
        >
          Generate Nodes
        </button>
        <button
          onClick={runPrims}
          disabled={isRunning || nodes.length === 0}
          className="button button-green"
        >
          Run Prim's Algorithm
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
        <div className="checkbox-group">
          <input
            type="checkbox"
            checked={isDirected}
            onChange={(e) => setIsDirected(e.target.checked)}
            id="directed"
          />
          <label htmlFor="directed">Directed Graph</label>
        </div>
      </div>

      <div className="edge-inputs">
        <input
          type="text"
          placeholder="From Node"
          value={newEdge.from}
          onChange={(e) => setNewEdge({...newEdge, from: e.target.value})}
          className="edge-input"
        />
        <input
          type="text"
          placeholder="To Node"
          value={newEdge.to}
          onChange={(e) => setNewEdge({...newEdge, to: e.target.value})}
          className="edge-input"
        />
        <input
          type="text"
          placeholder="Weight"
          value={newEdge.weight}
          onChange={(e) => setNewEdge({...newEdge, weight: e.target.value})}
          className="edge-input"
        />
        <button
          onClick={addEdge}
          disabled={isRunning}
          className="button button-purple"
        >
          Add Edge
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Weight</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((edge, index) => (
              <tr key={index}>
                <td>{edge.from}</td>
                <td>{edge.to}</td>
                <td>{edge.weight}</td>
                <td>
                  <button
                    onClick={() => removeEdge(index)}
                    disabled={isRunning}
                    className="button button-red"
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
        <svg ref={svgRef} className="graph-svg">
          {edges.map((edge, index) => {
            const fromNode = nodes[edge.from];
            const toNode = nodes[edge.to];
            const isMST = mstEdges.some(
              e => e.from === edge.from && e.to === edge.to ||
              (!isDirected && e.from === edge.to && e.to === edge.from)
            );
            
            return (
              <g key={`edge-${index}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  className={isMST ? "edge-mst" : "edge"}
                />
                {isDirected && (
                  <polygon
                    points={calculateArrowPoints(fromNode.x, fromNode.y, toNode.x, toNode.y)}
                    className={isMST ? "edge-arrow-mst" : "edge-arrow"}
                  />
                )}
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2}
                  dy="-5"
                  className="edge-weight"
                >
                  {edge.weight}
                </text>
              </g>
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
                className={`node ${visitedNodes.has(index) ? 'node-visited' : 'node-default'}
                  ${draggingNode === node.id ? 'node-dragging' : ''}`}
              />
              <text
                x={node.x}
                y={node.y}
                className="node-text"
                dy=".3em"
                textAnchor="middle"
              >
                {index}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;