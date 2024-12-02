import React, { useState, useRef } from 'react';
import './bfs.styles.css';

interface NodePosition {
  x: number;
  y: number;
}

interface EdgeInput {
  from: string;
  to: string;
}

interface NodePositions {
  [key: string]: NodePosition;
}

interface DragState {
  isDragging: boolean;
  vertex: string | null;
  offset: { x: number; y: number };
}

class Graph {
  private adjacencyList: { [key: string]: Set<string> };

  constructor() {
    this.adjacencyList = {};
  }

  addVertex(vertex: string): void {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = new Set();
    }
  }

  addEdge(vertex1: string, vertex2: string): void {
    if (!this.adjacencyList[vertex1] || !this.adjacencyList[vertex2]) {
      throw new Error("Vertices not found!");
    }
    this.adjacencyList[vertex1].add(vertex2);
    this.adjacencyList[vertex2].add(vertex1);
  }

  getNeighbors(vertex: string): string[] {
    return Array.from(this.adjacencyList[vertex] || []);
  }

  getAllVertices(): string[] {
    return Object.keys(this.adjacencyList);
  }

  bfs(startVertex: string): {
    result: string[];
    levelMap: Map<string, number>;
  } {
    const visited = new Set<string>();
    const queue: string[] = [];
    const result: string[] = [];
    const levelMap = new Map<string, number>();

    queue.push(startVertex);
    levelMap.set(startVertex, 0);

    while (queue.length > 0) {
      const currentVertex = queue.shift()!;

      if (!visited.has(currentVertex)) {
        visited.add(currentVertex);
        result.push(currentVertex);

        this.adjacencyList[currentVertex].forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
            levelMap.set(neighbor, levelMap.get(currentVertex)! + 1);
          }
        });
      }
    }

    return { result, levelMap };
  }
}

const BFSVisualization: React.FC = () => {
  const [graph] = useState<Graph>(new Graph());
  const [vertices, setVertices] = useState<Set<string>>(new Set());
  const [nodePositions, setNodePositions] = useState<NodePositions>({});
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [visitedEdges, setVisitedEdges] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [newVertex, setNewVertex] = useState<string>('');
  const [edge, setEdge] = useState<EdgeInput>({ from: '', to: '' });
  const [error, setError] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    vertex: null,
    offset: { x: 0, y: 0 }
  });
  
  const svgRef = useRef<SVGSVGElement>(null);

  const checkOverlap = (newPos: NodePosition, vertex: string): boolean => {
    const minDistance = 80;
    for (const [otherVertex, pos] of Object.entries(nodePositions)) {
      if (otherVertex !== vertex) {
        const dx = newPos.x - pos.x;
        const dy = newPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          return true;
        }
      }
    }
    return false;
  };

  const initializeNodePosition = (vertex: string): NodePosition => {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const position = {
        x: Math.random() * 600 + 100,
        y: Math.random() * 200 + 100
      };
      
      if (!checkOverlap(position, vertex)) {
        return position;
      }
      attempts++;
    }
    
    const vertexIndex = Array.from(vertices).length;
    return {
      x: 100 + (vertexIndex % 5) * 150,
      y: 100 + Math.floor(vertexIndex / 5) * 150
    };
  };

  const handleMouseDown = (e: React.MouseEvent, vertex: string) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      vertex,
      offset: {
        x: x - nodePositions[vertex].x,
        y: y - nodePositions[vertex].y
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.vertex) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragState.offset.x;
    const newY = e.clientY - rect.top - dragState.offset.y;

    // Boundary constraints
    const x = Math.max(40, Math.min(760, newX));
    const y = Math.max(40, Math.min(360, newY));

    const newPos = { x, y };
    
    if (!checkOverlap(newPos, dragState.vertex)) {
      setNodePositions(prev => ({
        ...prev,
        [dragState.vertex!]: newPos
      }));
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      vertex: null,
      offset: { x: 0, y: 0 }
    });
  };

  // Added missing methods
  const addVertex = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVertex) {
      setError('Please enter a vertex name');
      return;
    }

    if (vertices.has(newVertex)) {
      setError('Vertex already exists');
      return;
    }

    if (!/^[A-Z]$/.test(newVertex)) {
      setError('Vertex name must be a single uppercase letter');
      return;
    }

    try {
      graph.addVertex(newVertex);
      setVertices(prev => new Set([...prev, newVertex]));
      setNodePositions(prev => ({
        ...prev,
        [newVertex]: initializeNodePosition(newVertex)
      }));
      setNewVertex('');
      setError('');
    } catch (err) {
      setError('Failed to add vertex');
    }
  };

  const addEdge = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!edge.from || !edge.to) {
      setError('Please select both vertices');
      return;
    }

    if (edge.from === edge.to) {
      setError('Cannot create self-loop');
      return;
    }

    try {
      graph.addEdge(edge.from, edge.to);
      setEdge({ from: '', to: '' });
      setError('');
    } catch (err) {
      setError('Failed to add edge');
    }
  };

  const runBFS = async (startVertex: string) => {
    if (!startVertex || isRunning) return;
    
    setIsRunning(true);
    setVisitedNodes(new Set());
    setVisitedEdges(new Set());
    setQueue([]);
    setCurrentNode(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      const queue: string[] = [startVertex];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (!visited.has(current)) {
          setCurrentNode(current);
          setQueue([...queue]);
          await delay(animationSpeed);

          visited.add(current);
          setVisitedNodes(new Set(visited));

          const neighbors = graph.getNeighbors(current);
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
              setVisitedEdges(prev => new Set([...prev, `${current}-${neighbor}`, `${neighbor}-${current}`]));
            }
          }
        }
      }
    } finally {
      setIsRunning(false);
      setCurrentNode(null);
    }
  };

  const isEdgeVisited = (from: string, to: string): boolean => {
    return visitedEdges.has(`${from}-${to}`) || visitedEdges.has(`${to}-${from}`);
  };

  const getNodeColor = (vertex: string): string => {
    if (vertex === currentNode) return '#f6ad55'; // Current
    if (visitedNodes.has(vertex)) return '#4299e1'; // Visited
    if (queue.includes(vertex)) return '#9f7aea'; // Queued
    return '#a0aec0'; // Unvisited
  };

  return (
    <div>
      <div className='info'>
        <h1>Breadth First Search (BFS) for a Graph</h1>
    <p>
        Breadth First Search (BFS) is a fundamental graph traversal algorithm. It begins with a node, then first 
        traverses all its adjacent nodes. Once all adjacent nodes are visited, their adjacent nodes are traversed. 
        Unlike Depth First Search (DFS), BFS visits the closest vertices first. It mainly traverses vertices level by level.
    </p>
    <p>
        BFS is the foundation for many popular graph algorithms like Dijkstra’s shortest path, Kahn’s Algorithm, 
        and Prim’s Algorithm. It can be used to detect cycles in directed and undirected graphs, find shortest 
        paths in unweighted graphs, and solve many other problems.
    </p>

    <h2>Table of Contents</h2>
    <ul>
        <li>BFS from a Given Source</li>
        <li>BFS of the Whole Graph (Which May Be Disconnected)</li>
        <li>Complexity Analysis of the BFS Algorithm</li>
        <li>Applications of BFS in Graphs</li>
        <li>Problems on Breadth First Search</li>
        <li>FAQs on BFS for a Graph</li>
    </ul>

    <h2>BFS from a Given Source</h2>
    <p>
        The BFS algorithm starts from a given source and explores all reachable vertices. It is similar to the Breadth-First 
        Traversal of a tree. Starting with the given source (in trees, the root), BFS traverses vertices level by level using 
        a queue. 
    </p>
    <p>
        The key difference between graphs and trees is that graphs may contain cycles, meaning the same node can be revisited. 
        To avoid processing a node more than once, a <code>visited</code> boolean array is used.
    </p>
    <h3>Steps of the BFS Algorithm:</h3>
    <ol>
        <li>
            <strong>Initialization:</strong> Enqueue the given source vertex into a queue and mark it as visited.
        </li>
        <li>
            <strong>Exploration:</strong> While the queue is not empty:
            <ul>
                <li>Dequeue a node from the queue and visit it (e.g., print its value).</li>
                <li>For each unvisited neighbor of the dequeued node:
                    <ul>
                        <li>Enqueue the neighbor into the queue.</li>
                        <li>Mark the neighbor as visited.</li>
                    </ul>
                </li>
            </ul>
        </li>
        <li>
            <strong>Termination:</strong> Repeat step 2 until the queue is empty.
        </li>
    </ol>
    <p>This ensures that all nodes are visited in a breadth-first manner starting from the given source.</p>

    <h2>How Does the BFS Algorithm Work?</h2>
    <p>
        BFS uses a queue to keep track of nodes to be explored. It visits all vertices at the current depth level 
        before moving on to the vertices at the next level. Below is a visual representation of BFS traversal.
    </p>
    

    <h2>Further Learning</h2>
    <p>
        To deepen your understanding of BFS and related algorithms, consider exploring a comprehensive course like 
        <em>Tech Interview 101 – From DSA to System Design</em>. This course covers data structures and algorithms 
        from basic to advanced levels, providing you with the skills needed to excel in technical exams and interviews.
    </p>
      </div>
      <div>
      <div className="container">
      <h1 className="title">BFS Visualization</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="controls">
        <div className="control-row">
          <form onSubmit={addVertex} className="form-group">
            <div className="input-group">
              <input
                type="text"
                value={newVertex}
                onChange={(e) => setNewVertex(e.target.value.toUpperCase())}
                placeholder="Add vertex (A-Z)"
                className="input"
                maxLength={1}
              />
              <button type="submit" className="button">
                Add Vertex
              </button>
            </div>
          </form>

          <form onSubmit={addEdge} className="form-group">
            <div className="input-group">
              <select
                value={edge.from}
                onChange={(e) => setEdge({ ...edge, from: e.target.value })}
                className="select"
              >
                <option value="">From</option>
                {Array.from(vertices).map(vertex => (
                  <option key={vertex} value={vertex}>{vertex}</option>
                ))}
              </select>
              <select
                value={edge.to}
                onChange={(e) => setEdge({ ...edge, to: e.target.value })}
                className="select"
              >
                <option value="">To</option>
                {Array.from(vertices).map(vertex => (
                  <option key={vertex} value={vertex}>{vertex}</option>
                ))}
              </select>
              <button type="submit" className="button">
                Add Edge
              </button>
            </div>
          </form>
        </div>

        <div className="control-row">
          <select
            onChange={(e) => runBFS(e.target.value)}
            disabled={isRunning}
            className="select"
          >
            <option value="">Select start vertex</option>
            {Array.from(vertices).map(vertex => (
              <option key={vertex} value={vertex}>{vertex}</option>
            ))}
          </select>
          <div className="speed-control">
            <input
              type="range"
              min="200"
              max="2000"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="range"
            />
            <span>Animation Speed: {animationSpeed}ms</span>
          </div>
        </div>
      </div>

      <div className="graph-container">
        <svg 
          ref={svgRef}
          width="800" 
          height="400" 
          className="graph"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {Array.from(vertices).map(from => 
            graph.getNeighbors(from).map(to => {
              if (from < to) {
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={nodePositions[from]?.x}
                    y1={nodePositions[from]?.y}
                    x2={nodePositions[to]?.x}
                    y2={nodePositions[to]?.y}
                    className={isEdgeVisited(from, to) ? 'edge visited' : 'edge'}
                  />
                );
              }
              return null;
            })
          )}
          
          {Array.from(vertices).map(vertex => (
            <g 
              key={vertex}
              onMouseDown={(e) => handleMouseDown(e, vertex)}
              style={{ cursor: 'grab' }}
              className={dragState.vertex === vertex ? 'dragging' : ''}
            >
              <circle
                cx={nodePositions[vertex]?.x}
                cy={nodePositions[vertex]?.y}
                r="20"
                fill={getNodeColor(vertex)}
                className="vertex"
              />
              <text
                x={nodePositions[vertex]?.x}
                y={nodePositions[vertex]?.y}
                className="vertex-text"
              >
                {vertex}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color current"></div>
          <span>Current</span>
        </div>
        <div className="legend-item">
          <div className="legend-color visited"></div>
          <span>Visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-color queued"></div>
          <span>In Queue</span>
        </div>
        <div className="legend-item">
          <div className="legend-color unvisited"></div>
          <span>Unvisited</span>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};

export default BFSVisualization;