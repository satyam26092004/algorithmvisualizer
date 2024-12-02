import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Background,
  Controls,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import "./quickSort.styles.css";

interface NodeData {
  label: string;
  stage: string;
  borderColor?: string;
  backgroundColor?: string;
  numberColor?: string;
  comparisons?: string;
}

const StructuredNode: React.FC<{ data: NodeData }> = ({ data }) => {
  return (
    <div
      className="structured-node"
      style={{
        borderColor: data.borderColor || "#000",
        backgroundColor: data.backgroundColor || "#f0f0f0",
        margin: "5px",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle top-handle"
        style={{ background: data.borderColor || "#000" }}
      />

      <div className="node-stage">{data.stage || "Node"}</div>

      <div className="node-label">
        {data.label &&
          data.label.split(",").map((num, index) => (
            <span
              key={index}
              className="node-number"
              style={{
                backgroundColor: data.numberColor || "#333",
                margin: "2px",
                padding: "2px 5px",
              }}
            >
              {num.trim()}
            </span>
          ))}
      </div>

      {data.comparisons && (
        <div className="node-comparisons">{data.comparisons}</div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle bottom-handle"
        style={{ background: data.borderColor || "#000" }}
      />
    </div>
  );
};

const QuickSortVisualization: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [inputArray, setInputArray] = useState<string>("");
  const [sortedArray, setSortedArray] = useState<number[]>([]);

  const nodeTypes = useMemo(
    () => ({
      structuredNode: StructuredNode,
    }),
    []
  );

  const quickSort = useCallback(
    (
      arr: number[],
      depth: number = 0,
      parentNodeId: string | null = null,
      position: { x: number; y: number } = { x: 0, y: 0 }
    ): {
      sortedArray: number[];
      nodes: Node[];
      edges: Edge[];
      subtreeWidth: number;
    } => {
      // Improved spacing constants
      const HORIZONTAL_BASE_SPACING = 550; // Increased base horizontal spacing
      const VERTICAL_SPACING = 200; // Slightly reduced vertical spacing
      const NODE_WIDTH = 150; // Estimated node width

      // Base case handling
      if (arr.length <= 1) {
        const baseNodeId = `base-${arr.join("-") || "empty"}`;
        const baseNode: Node = {
          id: baseNodeId,
          type: "structuredNode",
          data: {
            label: arr.join(",") || "",
            stage: "Base Case",
            borderColor: "#48bb78",
            backgroundColor: "#9ae6b4",
            numberColor: "#2c3e50",
            comparisons:
              arr.length === 0
                ? "Empty Array"
                : "Single Element - No Sorting Needed",
          },
          position: position,
          draggable: true,
        };

        const baseEdges: Edge[] = parentNodeId
          ? [
              {
                id: `edge-${parentNodeId}-${baseNodeId}`,
                source: parentNodeId,
                target: baseNodeId,
                type: "default",
                animated: true,
                style: { stroke: "#48bb78", strokeWidth: 2 },
              },
            ]
          : [];

        return {
          sortedArray: arr,
          nodes: [baseNode],
          edges: baseEdges,
          subtreeWidth: NODE_WIDTH,
        };
      }

      // Choose the last element as pivot
      const pivotIndex = arr.length - 1;
      const pivot = arr[pivotIndex];

      // Partition the array
      const less: number[] = [];
      const equal: number[] = [];
      const greater: number[] = [];

      const partitionComparisons: string[] = [];

      arr.forEach((num) => {
        if (num < pivot) {
          less.push(num);
          partitionComparisons.push(`${num} < ${pivot} → Less`);
        } else if (num === pivot) {
          equal.push(num);
          partitionComparisons.push(`${num} = ${pivot} → Equal`);
        } else {
          greater.push(num);
          partitionComparisons.push(`${num} > ${pivot} → Greater`);
        }
      });

      // Current node (pivot selection)
      const currentNodeId = `partition-${arr.join("-")}`;
      const currentNode: Node = {
        id: currentNodeId,
        type: "structuredNode",
        data: {
          label: arr.join(","),
          stage: "Partition Selection",
          borderColor: "#ecc94b",
          backgroundColor: "#faf089",
          numberColor: "#2c3e50",
          comparisons: `Pivot: ${pivot}`,
        },
        position: position,
        draggable: true,
      };

      const parentEdge: Edge[] = parentNodeId
        ? [
            {
              id: `edge-${parentNodeId}-${currentNodeId}`,
              source: parentNodeId,
              target: currentNodeId,
              type: "default",
              animated: true,
              style: { stroke: "#ecc94b", strokeWidth: 2 },
            },
          ]
        : [];

      // Calculate horizontal spacing dynamically
      const horizontalSpacing = HORIZONTAL_BASE_SPACING * (1 / (depth + 1));

      // Recursive sorting of less and greater arrays
      const lessResult =
        less.length > 0
          ? quickSort(less, depth + 1, currentNodeId, {
              x: position.x - horizontalSpacing,
              y: position.y + VERTICAL_SPACING,
            })
          : {
              sortedArray: [],
              nodes: [],
              edges: [],
              subtreeWidth: 0,
            };

      const greaterResult =
        greater.length > 0
          ? quickSort(greater, depth + 1, currentNodeId, {
              x: position.x + horizontalSpacing,
              y: position.y + VERTICAL_SPACING,
            })
          : {
              sortedArray: [],
              nodes: [],
              edges: [],
              subtreeWidth: 0,
            };

      // Combine sorted results
      const sortedResult = [
        ...lessResult.sortedArray,
        ...equal,
        ...greaterResult.sortedArray,
      ];

      // Partition result node
      const partitionNodeId = `partition-result-${arr.join("-")}`;
      const partitionNode: Node = {
        id: partitionNodeId,
        type: "structuredNode",
        data: {
          label: `Less: [${less.join(",")}], Equal: [${equal.join(
            ","
          )}], Greater: [${greater.join(",")}]`,
          stage: "Partitioned Arrays",
          borderColor: "#4fd1c5",
          backgroundColor: "#76e4f7",
          numberColor: "#2c3e50",
          comparisons:
            partitionComparisons.slice(0, 3).join(" → ") +
            (partitionComparisons.length > 3 ? " ..." : ""),
        },
        position: {
          x: position.x,
          y: position.y + VERTICAL_SPACING,
        },
        draggable: true,
      };

      // Edges between nodes
      const partitionEdge: Edge[] = [
        {
          id: `edge-${currentNodeId}-${partitionNodeId}`,
          source: currentNodeId,
          target: partitionNodeId,
          type: "default",
          animated: true,
          style: { stroke: "#4fd1c5", strokeWidth: 2 },
        },
      ];

      // Final sorted subarray node
      const finalSortNodeId = `final-sort-${sortedResult.join("-")}`;
      const finalSortNode: Node = {
        id: finalSortNodeId,
        type: "structuredNode",
        data: {
          label: sortedResult.join(","),
          stage: "Final Sorted Subarray",
          borderColor: "#805ad5",
          backgroundColor: "#d6bcfa",
          numberColor: "#2c3e50",
        },
        position: {
          x: position.x,
          y: position.y + VERTICAL_SPACING * 2,
        },
        draggable: true,
      };

      const finalSortEdge: Edge[] = [
        {
          id: `edge-${partitionNodeId}-${finalSortNodeId}`,
          source: partitionNodeId,
          target: finalSortNodeId,
          type: "default",
          animated: true,
          style: { stroke: "#805ad5", strokeWidth: 2 },
        },
      ];

      // Calculate total subtree width
      const subtreeWidth =
        lessResult.subtreeWidth + greaterResult.subtreeWidth + NODE_WIDTH;

      // Combine all results
      return {
        sortedArray: sortedResult,
        nodes: [
          currentNode,
          partitionNode,
          finalSortNode,
          ...lessResult.nodes,
          ...greaterResult.nodes,
        ],
        edges: [
          ...parentEdge,
          ...partitionEdge,
          ...finalSortEdge,
          ...lessResult.edges,
          ...greaterResult.edges,
        ],
        subtreeWidth: subtreeWidth,
      };
    },
    []
  );

  const handleSort = () => {
    const numArray = inputArray
      .split(",")
      .map((num) => parseInt(num.trim(), 10))
      .filter((num) => !isNaN(num));

    if (numArray.length > 0) {
      const {
        sortedArray,
        nodes: newNodes,
        edges: newEdges,
      } = quickSort(
        numArray,
        0,
        null,
        { x: window.innerWidth / 2, y: 50 } // Start from center of screen
      );
      setNodes(newNodes);
      setEdges(newEdges);
      setSortedArray(sortedArray);
    }
  };

  // Rest of the component remains the same as in the previous implementation
  return (
    <div>
      <div className="info">
        <h1>QUICKSORT</h1>
        <p>QuickSort is a sorting algorithm based on the Divide and Conquer that picks an element as a pivot and partitions the given array around the picked pivot by placing the pivot in its correct position in the sorted array.</p>
        <h2>How does QuickSort Algorithm work?</h2>
        <p>
    QuickSort works on the principle of divide and conquer, breaking down the problem into smaller sub-problems.
  </p>
  <h3>Main Steps of the Algorithm:</h3>
  <ol>
    <li>
      <strong>Choose a Pivot:</strong> Select an element from the array as the pivot. 
      The choice of pivot can vary (e.g., first element, last element, random element, or median).
    </li>
    <li>
      <strong>Partition the Array:</strong> Rearrange the array around the pivot. 
      After partitioning, all elements smaller than the pivot will be on its left, and all elements greater than 
      the pivot will be on its right. The pivot is then in its correct position, and we obtain the index of the pivot.
    </li>
    <li>
      <strong>Recursively Call:</strong> Recursively apply the same process to the two partitioned sub-arrays 
      (left and right of the pivot).
    </li>
  </ol>
  <h3>Base Case:</h3>
  <p>
    The recursion stops when there is only one element left in the sub-array, as a single element is already sorted.
  </p>
  <h2>Choice of Pivot</h2>
  <p>
    There are many different choices for picking pivots:
  </p>
  <ol>
    <li>
      <strong>Always pick the first (or last) element as a pivot:</strong> 
      The below implementation picks the last element as the pivot. The problem with this approach is it ends up in the worst case when the array is already sorted.
    </li>
    <li>
      <strong>Pick a random element as a pivot:</strong> 
      This is a preferred approach because it does not have a pattern for which the worst case happens.
    </li>
    <li>
      <strong>Pick the median element as the pivot:</strong> 
      This is an ideal approach in terms of time complexity as we can find the median in linear time and the partition function will always divide the input array into two halves. 
      However, it is low on average as median finding has high constants.
    </li>
  </ol>

  <h2>Partition Algorithm</h2>
  <p>
    The key process in QuickSort is <code>partition()</code>. There are three common algorithms to partition. All these algorithms have O(n) time complexity:
  </p>
  <ol>
    <li>
      <strong>Naive Partition:</strong> 
      Here, we create a copy of the array. First, put all smaller elements and then all greater elements. Finally, we copy the temporary array back to the original array. 
      This requires O(n) extra space.
    </li>
    <li>
      <strong>Lomuto Partition:</strong> 
      We have used this partition in this article. This is a simple algorithm; we keep track of the index of smaller elements and keep swapping. 
      We have used it here because of its simplicity.
    </li>
    <li>
      <strong>Hoare’s Partition:</strong> 
      This is the fastest of all. Here, we traverse the array from both sides and keep swapping greater elements on the left with smaller ones on the right while the array is not partitioned. 
      Please refer to Hoare’s vs Lomuto for details.
    </li>
  </ol>

      </div>
      <div>
        <div className="quicksort-container">
          <h1 className="page-title">QuickSort Algorithm Visualization</h1>

          <div className="input-section">
            <input
              type="text"
              placeholder="Enter comma-separated numbers (e.g., 38, 27, 43, 3)"
              value={inputArray}
              onChange={(e) => setInputArray(e.target.value)}
              className="input-field"
            />
            <button onClick={handleSort} className="sort-button">
              Sort
            </button>
          </div>

          {sortedArray.length > 0 && (
            <div className="sorted-array-display">
              <strong>Sorted Array:</strong> {sortedArray.join(", ")}
            </div>
          )}

          <div className="flowchart-container" style={{ height: "850px" }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                attributionPosition="bottom-left"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Background variant="dots" gap={50} />
                <Controls />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSortVisualization;
