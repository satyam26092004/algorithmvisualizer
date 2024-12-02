import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import "./mergeSort.styles.css";

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

const MergeSortVisualization: React.FC = () => {
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

  const mergeSort = useCallback(
    (
      arr: number[],
      depth: number = 0,
      xOffset: number = 0,
      parentNodeId: string | null = null
    ): { sortedArray: number[]; nodes: Node[]; edges: Edge[] } => {
      const HORIZONTAL_SPACING = 300;
      const VERTICAL_SPACING = 250;

      if (arr.length <= 1) {
        const baseNodeId = `base-${arr.join("-") || "empty"}`;
        const baseNode: Node = {
          id: baseNodeId,
          type: "structuredNode",
          data: {
            label: arr.join(",") || "",
            stage: "Base Array",
            borderColor: "#48bb78",
            backgroundColor: "#9ae6b4",
            numberColor: "#2c3e50",
            comparisons: arr.length === 0 ? "Empty Array" : "Single Element",
          },
          position: {
            x: xOffset,
            y: depth * VERTICAL_SPACING,
          },
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
        };
      }

      const mid = Math.floor(arr.length / 2);
      const left = arr.slice(0, mid);
      const right = arr.slice(mid);

      const currentNodeId = `divide-${arr.join("-")}`;
      const currentNode: Node = {
        id: currentNodeId,
        type: "structuredNode",
        data: {
          label: arr.join(","),
          stage: "Splitting Array",
          borderColor: "#ecc94b",
          backgroundColor: "#faf089",
          numberColor: "#2c3e50",
          comparisons: `Splitting into Left: [${left.join(
            ","
          )}] and Right: [${right.join(",")}]`,
        },
        position: {
          x: xOffset,
          y: depth * VERTICAL_SPACING,
        },
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

      const leftResult = mergeSort(
        left,
        depth + 1,
        xOffset - HORIZONTAL_SPACING,
        currentNodeId
      );

      const rightResult = mergeSort(
        right,
        depth + 1,
        xOffset + HORIZONTAL_SPACING,
        currentNodeId
      );

      const merged: number[] = [];
      let i = 0,
        j = 0;
      const mergeComparisons: string[] = [];

      while (
        i < leftResult.sortedArray.length &&
        j < rightResult.sortedArray.length
      ) {
        mergeComparisons.push(
          `Compare ${leftResult.sortedArray[i]} vs ${rightResult.sortedArray[j]}`
        );
        if (leftResult.sortedArray[i] <= rightResult.sortedArray[j]) {
          merged.push(leftResult.sortedArray[i]);
          i++;
        } else {
          merged.push(rightResult.sortedArray[j]);
          j++;
        }
      }

      const mergedResult = [
        ...merged,
        ...leftResult.sortedArray.slice(i),
        ...rightResult.sortedArray.slice(j),
      ];

      const mergeNodeId = `merge-${mergedResult.join("-")}`;
      const mergeNode: Node = {
        id: mergeNodeId,
        type: "structuredNode",
        data: {
          label: mergedResult.join(","),
          stage: "Merging Arrays",
          borderColor: "#4fd1c5",
          backgroundColor: "#76e4f7",
          numberColor: "#2c3e50",
          comparisons:
            mergeComparisons.slice(0, 3).join(" → ") +
            (mergeComparisons.length > 3 ? " ..." : ""),
        },
        position: {
          x: xOffset,
          y: (depth + 1) * VERTICAL_SPACING,
        },
        draggable: true,
      };

      const mergeEdge: Edge[] = [
        {
          id: `edge-${currentNodeId}-${mergeNodeId}`,
          source: currentNodeId,
          target: mergeNodeId,
          type: "default",
          animated: true,
          style: { stroke: "#4fd1c5", strokeWidth: 2 },
        },
      ];

      return {
        sortedArray: mergedResult,
        nodes: [
          currentNode,
          mergeNode,
          ...leftResult.nodes,
          ...rightResult.nodes,
        ],
        edges: [
          ...parentEdge,
          ...mergeEdge,
          ...leftResult.edges,
          ...rightResult.edges,
        ],
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
      } = mergeSort(numArray);
      setNodes(newNodes);
      setEdges(newEdges);
      setSortedArray(sortedArray);
    }
  };

  return (
    <div>
      <div className="info">
        <h1>MERGE SORT</h1>
        <p>
          Merge sort is a sorting algorithm that follows the divide-and-conquer
          approach. It works by recursively dividing the input array into
          smaller subarrays and sorting those subarrays then merging them back
          together to obtain the sorted array. In simple terms, we can say that
          the process of merge sort is to divide the array into two halves, sort
          each half, and then merge the sorted halves back together. This
          process is repeated until the entire array is sorted.
        </p>
        <h2>How does Merge Sort work?</h2>
        <p>
          Merge sort is a popular sorting algorithm known for its efficiency and
          stability. It follows the divide-and-conquer approach to sort a given
          array of elements. Here’s a step-by-step explanation of how merge sort
          works:
          <ol>
            <li>
              Divide: Divide the list or array recursively into two halves until
              it can no more be divided.
            </li>
            <li>
              Conquer: Each subarray is sorted individually using the merge sort
              algorithm.
            </li>
            <li>
              Merge: The sorted subarrays are merged back together in sorted
              order. The process continues until all elements from both
              subarrays have been merged.
            </li>
          </ol>
        </p>
        <h2>Applications of Merge Sort:</h2>
        <li>Sorting large datasets</li>
        <li>
          External sorting (when the dataset is too large to fit in memory)
        </li>
        <li>Inversion counting</li>
        <li>
          Merge Sort and its variations are used in library methods of
          programming languages. For example its variation TimSort is used in
          Python, Java Android and Swift. The main reason why it is preferred to
          sort non-primitive types is stability which is not there in QuickSort.
          For example Arrays.sort in Java uses QuickSort while Collections.sort
          uses MergeSort.
        </li>
        <li>It is a preferred algorithm for sorting Linked lists.</li>
        <li>
          It can be easily parallelized as we can independently sort subarrays
          and then merge.
        </li>
        <li>
          The merge function of merge sort to efficiently solve the problems
          like union and intersection of two sorted arrays.
        </li>
      </div>
      <div>
        <div className="merge-sort-container">
          <h1 className="page-title">Merge Sort Algorithm Visualization</h1>

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

export default MergeSortVisualization;
