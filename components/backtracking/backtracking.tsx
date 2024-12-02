import React, { useState, useEffect } from "react";


const AnimatedVisualizer = () => {
  // State for N-Queens
  const [boardSize, setBoardSize] = useState(8);
  const [queenSteps, setQueenSteps] = useState([]);
  const [currentQueenStep, setCurrentQueenStep] = useState(0);
  const [isQueenAnimating, setIsQueenAnimating] = useState(false);

  // State for Graph Coloring
  const [nodes] = useState([
    { id: 0, x: 200, y: 100 },
    { id: 1, x: 300, y: 100 },
    { id: 2, x: 250, y: 200 },
    { id: 3, x: 150, y: 200 },
    { id: 4, x: 350, y: 200 },
    { id: 5, x: 100, y: 300 },
    { id: 6, x: 200, y: 300 },
    { id: 7, x: 300, y: 300 },
    { id: 8, x: 400, y: 300 },
    { id: 9, x: 250, y: 400 },
    { id: 10, x: 50, y: 400 }, // New node
    { id: 11, x: 450, y: 400 }, // New node
    { id: 12, x: 150, y: 500 }, // New node
    { id: 13, x: 350, y: 500 }, // New node
  ]);

  const [edges] = useState([
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 4],
    [2, 3],
    [2, 4],
    [3, 4],
    [5, 3],
    [5, 0],
    [5, 6],
    [6, 1],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 2],
    [10, 5], // New edges
    [10, 12], // New edges
    [11, 4], // New edges
    [11, 8], // New edges
    [12, 3], // New edges
    [12, 13], // New edges
    [13, 4], // New edges
    [13, 9], // New edges
  ]);
  const [coloringSteps, setColoringSteps] = useState([]);
  const [currentColorStep, setCurrentColorStep] = useState(0);
  const [isColorAnimating, setIsColorAnimating] = useState(false);
  const colors = [
    "#FF4444", // Red
    "#44FF44", // Green
    "#4444FF", // Blue
    "#FFFF44", // Yellow
    "#FF44FF", // Magenta
    "#44FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
    "#FFC0CB", // Pink
    "#A52A2A", // Brown
    "#FFD700", // Gold
    "#00FF00", // Lime
    "#0000FF", // Dark Blue
    "#FF1493", // Deep Pink
    "#8A2BE2", // Blue Violet
    "#7FFF00", // Chartreuse
    "#D2691E", // Chocolate
    "#FF4500", // Orange Red
    "#2E8B57", // Sea Green
    "#4682B4", // Steel Blue
  ];

  // N-Queens Logic
  const isSafe = (board, row, col) => {
    for (let i = 0; i < col; i++) {
      if (board[row][i]) return false;
    }
    for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j]) return false;
    }
    for (let i = row, j = col; i < boardSize && j >= 0; i++, j--) {
      if (board[i][j]) return false;
    }
    return true;
  };

  const solveNQueens = () => {
    const board = Array(boardSize)
      .fill()
      .map(() => Array(boardSize).fill(false));
    const steps = [];

    const solve = (board, col) => {
      if (col >= boardSize) return true;

      for (let row = 0; row < boardSize; row++) {
        if (isSafe(board, row, col)) {
          board[row][col] = true;
          steps.push({
            board: board.map((row) => [...row]),
            message: `Trying queen at row ${row + 1}, column ${col + 1}`,
          });

          if (solve(board, col + 1)) return true;

          board[row][col] = false;
          steps.push({
            board: board.map((row) => [...row]),
            message: `Backtracking from row ${row + 1}, column ${col + 1}`,
          });
        }
      }
      return false;
    };

    solve(board, 0);
    setQueenSteps(steps);
    setCurrentQueenStep(0);
    startQueenAnimation();
  };

  // Graph Coloring Logic
  const solveGraphColoring = () => {
    const steps = [];
    const colorMap = {};

    const solve = (nodeIndex = 0) => {
      if (nodeIndex === nodes.length) return true; // All nodes are colored

      for (let color of colors) {
        if (isColorSafe(colorMap, nodeIndex, color)) {
          colorMap[nodeIndex] = color; // Assign color to the node
          steps.push({
            colorMap: { ...colorMap },
            message: `Coloring node ${nodeIndex} with ${color}`,
          });

          if (solve(nodeIndex + 1)) return true; // Recur to color the next node

          delete colorMap[nodeIndex]; // Backtrack
          steps.push({
            colorMap: { ...colorMap },
            message: `Backtracking: removing color from node ${nodeIndex}`,
          });
        }
      }
      return false; // No valid color found
    };

    solve();
    setColoringSteps(steps);
    setCurrentColorStep(0);
    startColorAnimation();
  };

  const isColorSafe = (colorMap, nodeId, color) => {
    return edges.every(([a, b]) => {
      if (a === nodeId) return colorMap[b] !== color; // Check if adjacent node has the same color
      if (b === nodeId) return colorMap[a] !== color; // Check if adjacent node has the same color
      return true; // Not adjacent
    });
  };
  // Animation Control
  const startQueenAnimation = () => {
    setIsQueenAnimating(true);
  };

  const startColorAnimation = () => {
    setIsColorAnimating(true);
  };

  const resetNQueens = () => {
    setQueenSteps([]);
    setCurrentQueenStep(0);
    setIsQueenAnimating(false);
  };

  const resetGraphColoring = () => {
    setColoringSteps([]);
    setCurrentColorStep(0);
    setIsColorAnimating(false);
  };

  const stepForwardQueen = () => {
    if (currentQueenStep < queenSteps.length - 1) {
      setCurrentQueenStep((prev) => prev + 1);
    }
  };

  const stepBackwardQueen = () => {
    if (currentQueenStep > 0) {
      setCurrentQueenStep((prev) => prev - 1);
    }
  };

  const stepForwardColor = () => {
    if (currentColorStep < coloringSteps.length - 1) {
      setCurrentColorStep((prev) => prev + 1);
    }
  };

  const stepBackwardColor = () => {
    if (currentColorStep > 0) {
      setCurrentColorStep((prev) => prev - 1);
    }
  };

  useEffect(() => {
    let timer;
    if (isQueenAnimating && currentQueenStep < queenSteps.length - 1) {
      timer = setTimeout(() => {
        setCurrentQueenStep((prev) => prev + 1);
      }, 1000);
    } else if (isQueenAnimating) {
      setIsQueenAnimating(false);
    }
    return () => clearTimeout(timer);
  }, [isQueenAnimating, currentQueenStep, queenSteps.length]);

  useEffect(() => {
    let timer;
    if (isColorAnimating && currentColorStep < coloringSteps.length - 1) {
      timer = setTimeout(() => {
        setCurrentColorStep((prev) => prev + 1);
      }, 1000);
    } else if (isColorAnimating) {
      setIsColorAnimating(false);
    }
    return () => clearTimeout(timer);
  }, [isColorAnimating, currentColorStep, coloringSteps.length]);

  // Styles
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
      padding: "1rem",
      maxWidth: "800px",
      margin: "0 auto",
      fontFamily: "system-ui",
    },
    section: {
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "1rem",
      backgroundColor: "white",
    },
    button: {
      padding: "0.5rem 1rem",
      backgroundColor: "#4444FF",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      margin: ".7rem",
    },
    board: {
      display: "grid",
      gap: "1px",
      width: "fit-content",
      margin: "1rem 0",
    },
    cell: {
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
    },
    message: {
      padding: "0.5rem",
      backgroundColor: "#f0f0f0",
      borderRadius: "4px",
      marginBottom: "1rem",
    },
    input: {
      padding: "0.5rem",
      margin: "0.5rem 0",
      borderRadius: "4px",
      border: "1px solid #ccc",
    },
  };

  return (
    <div>
      {/* N-Queens Section */}
      <div className="info">
        <h1>N Queen Problem</h1>
        <h2>What is the N-Queen Problem?</h2>
        <p>
          The N Queen problem is the challenge of placing N chess queens on an
          N×N chessboard so that no two queens attack each other. For example,
          the following is a solution for the 4-Queen problem:
        </p>

        <h2>N Queen Problem using Backtracking:</h2>
        <p>
          The idea is to place queens one by one in different columns, starting
          from the leftmost column. When we place a queen in a column, we check
          for clashes with already placed queens. In the current column, if we
          find a row for which there is no clash, we mark this row and column as
          part of the solution. If we do not find such a row due to clashes,
          then we backtrack and return false.
        </p>
        <h3>Steps to Solve:</h3>
        <ol>
          <li>Start in the leftmost column.</li>
          <li>If all queens are placed, return true.</li>
          <li>Try all rows in the current column:</li>
          <ul>
            <li>If the queen can be placed safely in this row:</li>
            <ul>
              <li>Mark this [row, column] as part of the solution.</li>
              <li>
                Recursively check if placing the queen here leads to a solution.
              </li>
            </ul>
            <li>
              If placing the queen in [row, column] leads to a solution, return
              true.
            </li>
            <li>
              If placing the queen doesn’t lead to a solution, unmark this [row,
              column] and backtrack.
            </li>
          </ul>
          <li>
            If all rows have been tried and no valid solution is found, return
            false.
          </li>
        </ol>
      </div>
      <div style={{ width: "1200px", paddingLeft: "150px", fontSize: "20px" }}>
        <h2>N-Queens Visualization</h2>
        <input
          type="number"
          value={boardSize}
          onChange={(e) =>
            setBoardSize(Math.max(4, Math.min(20, Number(e.target.value))))
          } // Limit board size
          style={styles.input}
          placeholder="Enter board size (4-20)"
        />
        <button
          style={styles.button}
          onClick={() => !isQueenAnimating && solveNQueens()}
          disabled={isQueenAnimating}
        >
          {isQueenAnimating ? "Solving..." : "Start N-Queens"}
        </button>
        <button
          style={styles.button}
          onClick={resetNQueens}
          disabled={!queenSteps.length}
        >
          Reset N-Queens
        </button>
        <button
          style={styles.button}
          onClick={stepBackwardQueen}
          disabled={currentQueenStep === 0 || isQueenAnimating}
        >
          Step Back
        </button>
        <button
          style={styles.button}
          onClick={stepForwardQueen}
          disabled={
            currentQueenStep >= queenSteps.length - 1 || isQueenAnimating
          }
        >
          Step Forward
        </button>
        {queenSteps[currentQueenStep]?.message && (
          <div style={styles.message}>
            {queenSteps[currentQueenStep].message}
          </div>
        )}
        <div
          style={{
            ...styles.board,
            gridTemplateColumns: `repeat(${boardSize}, 40px)`,
          }}
        >
          {Array(boardSize)
            .fill()
            .map((_, row) =>
              Array(boardSize)
                .fill()
                .map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    style={{
                      ...styles.cell,
                      backgroundColor:
                        (row + col) % 2 === 0 ? "#f0f0f0" : "#d0d0d0",
                    }}
                  >
                    {queenSteps[currentQueenStep]?.board[row][col] && "♛"}
                  </div>
                ))
            )}
        </div>
      </div>

      {/* Graph Coloring Section */}
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          lineHeight: 1.6,
          margin: "150px",
          fontSize: "25px",
          width: "1000px",
        }}
      >
        <h1 style={{ color: "#2c3e50", fontSize: "50px" }}>
          M-Coloring Problem
        </h1>
        <p>
          Given an undirected graph and a number <strong>m</strong>, the task is
          to color the given graph with at most <strong>m</strong> colors such
          that no two adjacent vertices of the graph are colored with the same
          color.
        </p>
        <p>
          <strong>Note:</strong> Here coloring of a graph means the assignment
          of colors to all vertices.
        </p>
        <h2 style={{ color: "#2c3e50" }}>Example</h2>
        <p>
          Below is an example of a graph that can be colored with 3 different
          colors:
        </p>
        <p>Input: graph =</p>
        <pre
          style={{
            backgroundColor: "#f8f9fa",
            padding: "10px",
            border: "1px solid #ccc",
            display: "inline-block",
          }}
        >
          {`{0, 1, 1, 1},
{1, 0, 1, 0},
{1, 1, 0, 1},
{1, 0, 1, 0}`}
        </pre>
        <p>
          Output: Solution Exists: Following are the assigned colors:{" "}
          <strong>1 2 3 2</strong>
        </p>
        <p>
          Explanation: By coloring the vertices with the following colors,
          adjacent vertices do not have the same colors.
        </p>
        <p>Input: graph =</p>
        <pre
          style={{
            backgroundColor: "#f8f9fa",
            padding: "10px",
            border: "1px solid #ccc",
            display: "inline-block",
          }}
        >
          {`{1, 1, 1, 1},
{1, 1, 1, 1},
{1, 1, 1, 1},
{1, 1, 1, 1}`}
        </pre>
        <p>
          Output: <strong>Solution does not exist</strong>
        </p>
        <p>Explanation: No solution exists.</p>
        <h2 style={{ color: "#2c3e50" }}>
          Naive Approach for M-Coloring Problem
        </h2>
        <p>
          Generate all possible configurations of colors. Since each node can be
          colored using any of the m available colors, the total number of color
          configurations possible is <code>m^V</code>. After generating a
          configuration of color, check if the adjacent vertices have the same
          color or not. If the conditions are met, print the combination.
        </p>
        <p>
          <strong>Time Complexity:</strong> O(m^V). There are O(m^V)
          combinations of colors.
          <br />
          <strong>Auxiliary Space:</strong> O(V). The recursive stack of the{" "}
          <code>graphColoring(...)</code> function will require O(V) space.
        </p>
        <h2 style={{ color: "#2c3e50" }}>
          M-Coloring Problem using Backtracking
        </h2>
        <p>
          Assign colors one by one to different vertices, starting from vertex
          0. Before assigning a color, check for safety by considering already
          assigned colors to the adjacent vertices, i.e., check if the adjacent
          vertices have the same color or not. If there is any color assignment
          that does not violate the conditions, mark the color assignment as
          part of the solution. If no assignment of color is possible, then
          backtrack and return false.
        </p>
        <h3 style={{ color: "#34495e" }}>Steps to Solve:</h3>
        <ol style={{ marginLeft: "20px" }}>
          <li>
            Create a recursive function that takes the graph, current index,
            number of vertices, and color array.
          </li>
          <li>
            If the current index is equal to the number of vertices, print the
            color configuration in the color array.
          </li>
          <li>Assign a color to a vertex from the range (1 to m).</li>
          <li>
            For every assigned color, check if the configuration is safe (i.e.,
            check if the adjacent vertices do not have the same color) and
            recursively call the function with the next index and number of
            vertices. Otherwise, return false.
          </li>
          <li>If any recursive function returns true, then return true.</li>
          <li>If no recursive function returns true, then return false.</li>
        </ol>
        <h2 style={{ color: "#2c3e50" }}>Illustration</h2>
        <p>To color the graph, color each node one by one:</p>
        <ul style={{ marginLeft: "20px" }}>
          <li>
            To color the first node, there are 3 choices of colors: Red, Green,
            and Blue. Let's take Red for the first node.
          </li>
          <li>
            After Red is fixed for the first node, make a choice for the second
            node in a similar manner, then for the third node, and so on.
          </li>
          <li>
            While choosing a color for a node, it should not be the same as the
            color of the adjacent node.
          </li>
        </ul>
      </div>
      <div style={{width:'900px',paddingLeft:'100px'}}>
        <h2>Graph Coloring Visualization</h2>
        <button
          style={styles.button}
          onClick={() => !isColorAnimating && solveGraphColoring()}
          disabled={isColorAnimating}
          styles={{margin:'5px'}}
        >
          {isColorAnimating ? "Coloring..." : "Start Graph Coloring"}
        </button>
        <button
         style={styles.button}
          onClick={resetGraphColoring}
          disabled={!coloringSteps.length}
          styles={{margin:'5px'}}
        >
          Reset Graph Coloring
        </button>
        <button
          style={styles.button}
          onClick={stepBackwardColor}
          disabled={currentColorStep === 0 || isColorAnimating}
        >
          Step Back
        </button>
        <button
         style={styles.button}
          onClick={stepForwardColor}
          disabled={
            currentColorStep >= coloringSteps.length - 1 || isColorAnimating
          }
        >
          Step Forward
        </button>
        {coloringSteps[currentColorStep]?.message && (
          <div style={styles.message}>
            {coloringSteps[currentColorStep].message}
          </div>
        )}
        <svg width="400" height="300" style={{ border: "1px solid #ccc" }}>
          {/* Edges */}
          {edges.map(([a, b], i) => (
            <line
              key={`edge-${i}`}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="#666"
              strokeWidth="2"
            />
          ))}
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={`node-${node.id}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={
                  coloringSteps[currentColorStep]?.colorMap[node.id] || "white"
                }
                stroke="black"
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={
                  coloringSteps[currentColorStep]?.colorMap[node.id]
                    ? "white"
                    : "black"
                }
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default AnimatedVisualizer;
