import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

class Graph {
  constructor() {
    this.adjacencyList = {};
    this.positions = {};
  }

  generateOptimalLayout(nodes) {
    const width = 600;
    const height = 400;
    const nodeCount = nodes.length;
    const radius = Math.min(width, height) * 0.4;
    
    return nodes.reduce((acc, node, index) => {
      const angle = (2 * Math.PI * index) / nodeCount;
      acc[node] = {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle)
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
    // Ensure vertices exist
    this.addVertex(vertex1);
    this.addVertex(vertex2);

    // Add edge
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
      distance: distances[end]
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
  const [vertex1, setVertex1] = useState('');
  const [vertex2, setVertex2] = useState('');
  const [weight, setWeight] = useState('');
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');
  const [shortestPath, setShortestPath] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [currentPath, setCurrentPath] = useState([]);
  const [nodePositions, setNodePositions] = useState({});

  const addEdge = () => {
    if (!vertex1 || !vertex2 || !weight) return;

    // Get unique nodes
    const uniqueNodes = [...new Set([...edges.flatMap(e => [e.vertex1, e.vertex2]), vertex1, vertex2])];
    
    // Generate optimal layout
    const positions = graph.generateOptimalLayout(uniqueNodes);
    setNodePositions(positions);

    // Create a new graph instance to ensure clean state
    const newGraph = new Graph();
    
    // Add existing edges to the new graph
    edges.forEach(edge => {
      newGraph.addEdge(edge.vertex1, edge.vertex2, edge.weight, isDirected);
    });

    // Add the new edge
    newGraph.addEdge(vertex1, vertex2, Number(weight), isDirected);

    // Update graph and edges
    setGraph(newGraph);
    setEdges(prev => [...prev, { vertex1, vertex2, weight: Number(weight) }]);
    
    // Reset input fields
    setVertex1('');
    setVertex2('');
    setWeight('');
  };

  const findShortestPath = () => {
    if (!startNode || !endNode) return;

    const result = graph.dijkstra(startNode, endNode);
    setShortestPath(result);
    setCurrentPath(result.path);
    setAnimationStep(0);
  };

  useEffect(() => {
    let timer;
    if (shortestPath && animationStep < currentPath.length - 1) {
      timer = setTimeout(() => {
        setAnimationStep(prev => prev + 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [shortestPath, animationStep, currentPath]);

  const uniqueNodes = [...new Set(edges.flatMap(edge => [edge.vertex1, edge.vertex2]))];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Graph Path Visualizer</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Graph Type</label>
        <Select value={isDirected ? 'directed' : 'undirected'} onValueChange={(value) => setIsDirected(value === 'directed')}>
          <SelectTrigger>
            <SelectValue placeholder="Select Graph Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="directed">Directed Graph</SelectItem>
            <SelectItem value="undirected">Undirected Graph</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Input 
          placeholder="Vertex 1" 
          value={vertex1} 
          onChange={(e) => setVertex1(e.target.value)}
        />
        <Input 
          placeholder="Vertex 2" 
          value={vertex2} 
          onChange={(e) => setVertex2(e.target.value)}
        />
        <Input 
          type="number" 
          placeholder="Weight" 
          value={weight} 
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <Button onClick={addEdge} className="mb-4">Add Edge</Button>

      <svg width="600" height="400" className="border-2 border-gray-300">
        {/* Edges */}
        {edges.map((edge, index) => {
          const start = nodePositions[edge.vertex1];
          const end = nodePositions[edge.vertex2];
          
          // Marker for directed edges
          const markerEnd = isDirected ? 'url(#arrowhead)' : '';
          
          return (
            <React.Fragment key={index}>
              <line 
                x1={start.x} 
                y1={start.y} 
                x2={end.x} 
                y2={end.y} 
                stroke="gray" 
                strokeWidth="2" 
                markerEnd={markerEnd}
              />
              <text 
                x={(start.x + end.x) / 2} 
                y={(start.y + end.y) / 2} 
                textAnchor="middle" 
                fontSize="12"
                fill="red"
              >
                {edge.weight}
              </text>
            </React.Fragment>
          );
        })}

        {/* Arrowhead marker for directed edges */}
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="0" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
          </marker>
        </defs>

        {/* Nodes */}
        {Object.entries(nodePositions).map(([node, pos]) => (
          <g key={node}>
            <circle 
              cx={pos.x} 
              cy={pos.y} 
              r="20" 
              fill={node === startNode ? 'green' : node === endNode ? 'red' : 'blue'} 
            />
            <text 
              x={pos.x} 
              y={pos.y} 
              textAnchor="middle" 
              dy=".3em" 
              fill="white"
            >
              {node}
            </text>
          </g>
        ))}

        {/* Animated Vehicle */}
        {shortestPath && animationStep < currentPath.length && (
          <circle 
            cx={nodePositions[currentPath[animationStep]].x} 
            cy={nodePositions[currentPath[animationStep]].y} 
            r="15" 
            fill="orange" 
          />
        )}
      </svg>

      <div className="mt-4 flex space-x-4">
        <Select value={startNode} onValueChange={setStartNode}>
          <SelectTrigger>
            <SelectValue placeholder="Start Node" />
          </SelectTrigger>
          <SelectContent>
            {uniqueNodes.map(node => (
              <SelectItem key={node} value={node}>{node}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={endNode} onValueChange={setEndNode}>
          <SelectTrigger>
            <SelectValue placeholder="End Node" />
          </SelectTrigger>
          <SelectContent>
            {uniqueNodes.map(node => (
              <SelectItem key={node} value={node}>{node}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={findShortestPath}>Find Shortest Path</Button>
      </div>

      {shortestPath && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-bold mb-2">Path Details</h2>
          <p className="mb-2">
            <strong>Full Path:</strong> {shortestPath.path.join(' → ')}
          </p>
          <p className="mb-2">
            <strong>Total Distance:</strong> {shortestPath.distance}
          </p>
          <p>
            <strong>Current Step:</strong> {currentPath[animationStep]} 
            (Step {animationStep + 1} of {currentPath.length})
          </p>
        </div>
      )}
    </div>
  );
};

export default GraphVisualizer;