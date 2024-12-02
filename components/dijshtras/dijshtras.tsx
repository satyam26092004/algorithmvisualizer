import React, { useState, useEffect } from "react";
import "./dijshtras.styles.css";

class Graph {
  constructor() {
    this.adjacencyList = {};
    this.positions = {};
  }

  generateOptimalLayout(nodes) {
    const width = 1000;
    const height = 400;
    const nodeCount = nodes.length;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;

    return nodes.reduce((acc, node, index) => {
      const angleStep = (2 * Math.PI) / Math.max(1, nodeCount);
      const angle = index * angleStep;
      const radius = Math.min(maxRadius, (index + 1) * 40);

      acc[node] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
      return acc;
    }, {});
  }

  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
  }

  addEdge(vertex1, vertex2, weight, isDirected) {
    this.addVertex(vertex1);
    this.addVertex(vertex2);

    this.adjacencyList[vertex1].push({ node: vertex2, weight });
    if (!isDirected) {
      this.adjacencyList[vertex2].push({ node: vertex1, weight });
    }
  }

  dijkstra(start, end) {
    const nodes = new PriorityQueue();
    const distances = {};
    const previous = {};
    let path = [];
    let smallest;

    for (let vertex in this.adjacencyList) {
      if (vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(vertex, 0);
      } else {
        distances[vertex] = Infinity;
        nodes.enqueue(vertex, Infinity);
      }
      previous[vertex] = null;
    }

    while (nodes.values.length) {
      smallest = nodes.dequeue().val;

      if (smallest === end) {
        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }
        break;
      }

      if (smallest || distances[smallest] !== Infinity) {
        for (let neighbor of this.adjacencyList[smallest]) {
          let candidate = distances[smallest] + neighbor.weight;
          let nextNeighbor = neighbor.node;

          if (candidate < distances[nextNeighbor]) {
            distances[nextNeighbor] = candidate;
            previous[nextNeighbor] = smallest;
            nodes.enqueue(nextNeighbor, candidate);
          }
        }
      }
    }

    return {
      path: [smallest, ...path.reverse()],
      distance: distances[end],
    };
  }
}

class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }

  dequeue() {
    return this.values.shift();
  }

  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }
}

const GraphVisualizer = () => {
  const [graph, setGraph] = useState(new Graph());
  const [isDirected, setIsDirected] = useState(false);
  const [edges, setEdges] = useState([]);
  const [vertex1, setVertex1] = useState("");
  const [vertex2, setVertex2] = useState("");
  const [weight, setWeight] = useState("");
  const [startNode, setStartNode] = useState("");
  const [endNode, setEndNode] = useState("");
  const [shortestPath, setShortestPath] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [currentPath, setCurrentPath] = useState([]);
  const [nodePositions, setNodePositions] = useState({});
  const [draggedNode, setDraggedNode] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const MAX_EDGES = 10;

  const handleDragStart = (e, node) => {
    const svgRect = e.target.closest("svg").getBoundingClientRect();
    const offsetX = e.clientX - svgRect.left - nodePositions[node].x;
    const offsetY = e.clientY - svgRect.top - nodePositions[node].y;

    setDraggedNode(node);
    setOffset({ x: offsetX, y: offsetY });
  };

  const handleDrag = (e) => {
    if (!draggedNode) return;

    const svgRect = e.target.closest("svg").getBoundingClientRect();
    const x = Math.max(20, Math.min(580, e.clientX - svgRect.left - offset.x));
    const y = Math.max(20, Math.min(380, e.clientY - svgRect.top - offset.y));

    setNodePositions((prev) => ({
      ...prev,
      [draggedNode]: { x, y },
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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggedNode]);

  const addEdge = () => {
    if (!vertex1 || !vertex2 || !weight) {
      alert("Please fill in all fields");
      return;
    }

    if (edges.length >= MAX_EDGES) {
      alert(`Maximum of ${MAX_EDGES} edges allowed`);
      return;
    }

    const duplicateEdge = edges.some(
      (e) =>
        (e.vertex1 === vertex1 && e.vertex2 === vertex2) ||
        (!isDirected && e.vertex1 === vertex2 && e.vertex2 === vertex1)
    );

    if (duplicateEdge) {
      alert("This edge already exists");
      return;
    }

    const uniqueNodes = [
      ...new Set([
        ...edges.flatMap((e) => [e.vertex1, e.vertex2]),
        vertex1,
        vertex2,
      ]),
    ];
    const positions = graph.generateOptimalLayout(uniqueNodes);
    setNodePositions(positions);

    const newGraph = new Graph();
    edges.forEach((edge) => {
      newGraph.addEdge(edge.vertex1, edge.vertex2, edge.weight, isDirected);
    });
    newGraph.addEdge(vertex1, vertex2, Number(weight), isDirected);

    setGraph(newGraph);
    setEdges((prev) => [...prev, { vertex1, vertex2, weight: Number(weight) }]);
    setVertex1("");
    setVertex2("");
    setWeight("");
  };

  const findShortestPath = () => {
    if (!startNode || !endNode) {
      alert("Please select both start and end nodes");
      return;
    }

    const result = graph.dijkstra(startNode, endNode);
    setShortestPath(result);
    setCurrentPath(result.path);
    setAnimationStep(0);
  };

  const clearGraph = () => {
    if (window.confirm("Are you sure you want to clear the graph?")) {
      setEdges([]);
      setGraph(new Graph());
      setNodePositions({});
      setStartNode("");
      setEndNode("");
      setShortestPath(null);
      setCurrentPath([]);
      setAnimationStep(0);
    }
  };

  useEffect(() => {
    let timer;
    if (shortestPath && animationStep < currentPath.length - 1) {
      timer = setTimeout(() => {
        setAnimationStep((prev) => prev + 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [shortestPath, animationStep, currentPath]);

  const uniqueNodes = [
    ...new Set(edges.flatMap((edge) => [edge.vertex1, edge.vertex2])),
  ];

  return (
    <div className="graph-visualizer">
      <div className="header">
        <div className="text-info">
          <h1> Dijkstra’s Algorithm:</h1>
          <p>
            Dijkstra’s algorithm is a popular algorithms for solving many
            single-source shortest path problems having non-negative edge weight
            in the graphs i.e., it is to find the shortest distance between two
            vertices on a graph. It was conceived by Dutch computer scientist
            Edsger W. Dijkstra in 1956.
          </p>
          The algorithm maintains a set of visited vertices and a set of
          unvisited vertices. It starts at the source vertex and iteratively
          selects the unvisited vertex with the smallest tentative distance from
          the source. It then visits the neighbors of this vertex and updates
          their tentative distances if a shorter path is found. This process
          continues until the destination vertex is reached, or all reachable
          vertices have been visited.
          <h2>Need for Dijkstra’s Algorithm (Purpose and Use-Cases)</h2>
          <p>
            The need for Dijkstra’s algorithm arises in many applications where
            finding the shortest path between two points is crucial. For
            example, It can be used in the routing protocols for computer
            networks and also used by map systems to find the shortest path
            between starting point and the Destination (as explained in How does
            Google Maps work?)
          </p>
          <h2>
            Can Dijkstra’s Algorithm work on both Directed and Undirected
            graphs?
          </h2>
          <p>
            Yes, Dijkstra’s algorithm can work on both directed graphs and
            undirected graphs as this algorithm is designed to work on any type
            of graph as long as it meets the requirements of having non-negative
            edge weights and being connected.
            <ol>
              <li>
                In a directed graph, each edge has a direction, indicating the
                direction of travel between the vertices connected by the edge.
                In this case, the algorithm follows the direction of the edges
                when searching for the shortest path.
              </li>
              <li>
                In an undirected graph, the edges have no direction, and the
                algorithm can traverse both forward and backward along the edges
                when searching for the shortest path.
              </li>
            </ol>
          </p>
          <h2>Algorithm for Dijkstra’s Algorithm:</h2>
          <ol>
            <li>
              Mark the source node with a current distance of 0 and the rest
              with infinity.
            </li>
            <li>
              Set the non-visited node with the smallest current distance as the
              current node.
            </li>
            <li>
              For each neighbor, N of the current node adds the current distance
              of the adjacent node with the weight of the edge connecting 0-1.
              If it is smaller than the current distance of Node, set it as the
              new current distance of N.
            </li>
            <li>Mark the current node 1 as visited.</li>
            <li>Go to step 2 if there are any nodes are unvisited.</li>
          </ol>
        </div>
        <h1>Graph Path Visualizer</h1>
        <p className="description">
          Visualize Dijkstra's shortest path algorithm. Create your graph by
          adding edges, then find the shortest path between any two points.
        </p>
      </div>

      <div className="quick-guide">
        <h2>Quick Guide:</h2>
        <ul>
          <li>
            Add edges by entering vertex names (e.g., A, B, C) and weights
          </li>
          <li>Drag nodes to rearrange the graph layout</li>
          <li>Select start and end nodes to find the shortest path</li>
          <li>Watch the animation to see the algorithm in action</li>
        </ul>
      </div>
      <div className="con">
        <div className="controls-section">
          <div className="graph-type">
            <label>Graph Type:</label>
            <select
              value={isDirected ? "directed" : "undirected"}
              onChange={(e) => setIsDirected(e.target.value === "directed")}
            >
              <option value="directed">Directed Graph (one-way paths)</option>
              <option value="undirected">
                Undirected Graph (two-way paths)
              </option>
            </select>
          </div>

          <div className="edge-inputs">
            <input
              placeholder="From (e.g., A)"
              value={vertex1}
              onChange={(e) => setVertex1(e.target.value)}
            />
            <input
              placeholder="To (e.g., B)"
              value={vertex2}
              onChange={(e) => setVertex2(e.target.value)}
            />
            <input
              type="number"
              placeholder="Distance/Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <button onClick={addEdge} className="add-edge">
              Add Edge
            </button>
          </div>

          {edges.length >= MAX_EDGES && (
            <div className="max-edges-warning">
              Maximum of {MAX_EDGES} edges reached. Remove existing edges to add
              new ones.
            </div>
          )}
        </div>

        <div className="graph-display">
          <svg width="600" height="400">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
            </defs>

            {edges.map((edge, index) => {
              const start = nodePositions[edge.vertex1];
              const end = nodePositions[edge.vertex2];

              if (!start || !end) return null;

              const pathClass =
                shortestPath?.path.includes(edge.vertex1) &&
                shortestPath?.path.includes(edge.vertex2)
                  ? "path-edge"
                  : "normal-edge";

              return (
                <g key={index}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    className={pathClass}
                    markerEnd={isDirected ? "url(#arrowhead)" : ""}
                  />
                  <text
                    x={(start.x + end.x) / 2}
                    y={(start.y + end.y) / 2}
                    className="edge-weight"
                  >
                    {edge.weight}
                  </text>
                </g>
              );
            })}

            {Object.entries(nodePositions).map(([node, pos]) => (
              <g
                key={node}
                onMouseDown={(e) => handleDragStart(e, node)}
                className="node-group"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="20"
                  className={`node ${
                    node === startNode
                      ? "start-node"
                      : node === endNode
                      ? "end-node"
                      : "default-node"
                  }`}
                />
                <text x={pos.x} y={pos.y} className="node-label">
                  {node}
                </text>
              </g>
            ))}

            {shortestPath && animationStep < currentPath.length && (
              <circle
                cx={nodePositions[currentPath[animationStep]]?.x}
                cy={nodePositions[currentPath[animationStep]]?.y}
                r="15"
                className="path-animation"
              />
            )}
          </svg>
        </div>

        <div className="path-controls">
          <select
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
          >
            <option value="">Select Start Node</option>
            {uniqueNodes.map((node) => (
              <option key={node} value={node}>
                {node}
              </option>
            ))}
          </select>

          <select value={endNode} onChange={(e) => setEndNode(e.target.value)}>
            <option value="">Select End Node</option>
            {uniqueNodes.map((node) => (
              <option key={node} value={node}>
                {node}
              </option>
            ))}
          </select>

          <button onClick={findShortestPath} className="find-path">
            Find Shortest Path
          </button>
        </div>

        {shortestPath && (
          <div className="path-results">
            <h2>Path Found!</h2>
            <div className="result-details">
              <p>
                <span>Route:</span> {shortestPath.path.join(" → ")}
              </p>
              <p>
                <span>Total Distance:</span> {shortestPath.distance}
              </p>
              <p>
                <span>Current Step:</span> {currentPath[animationStep]}
                (Step {animationStep + 1} of {currentPath.length})
              </p>
            </div>
          </div>
        )}

        <div className="clear-section">
          <button onClick={clearGraph} className="clear-graph">
            Clear Graph
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;
