import React, { useState } from "react";
import "./bubble.styles.css";

const BubbleSortSimulation: React.FC = () => {
  const [array, setArray] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [highlighted, setHighlighted] = useState<{ i: number; j: number }>({
    i: -1,
    j: -1,
  });
  const [swapStep, setSwapStep] = useState<number>(0);

  const maxArrayLength = 12;
  const maxValue = 100;
  const minValue = 5;

  const avatars = [
    "👾", "👨‍💻", "🐱", "🦄", "🚀", "🎨", "🦊", "⚡", "🧑‍🦰", "👩‍🦳", "👩‍🦳", "👨‍🦳", "🧑‍🦱", "🐶", "☠️"
  ];

  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const inputArray = inputValue
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num) && num >= minValue && num <= maxValue);

    if (inputArray.length > maxArrayLength) {
      alert(`Please enter no more than ${maxArrayLength} numbers.`);
      return;
    }

    setArray(inputArray);
    setInputValue("");
  };

  const bubbleSort = async () => {
    setIsSorting(true);
    const arr = [...array];

    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - 1 - i; j++) {
        setHighlighted({ i, j });
        if (arr[j] > arr[j + 1]) {
          setHighlighted((prev) => ({ ...prev, j: j + 1 })); // Highlight the elements being swapped
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // Swap the elements
          setArray([...arr]);
          setSwapStep((prevStep) => prevStep + 1); // Increment swap step
          await new Promise((resolve) => setTimeout(resolve, 500)); // Slow down for visualization
        }
      }
    }

    setHighlighted({ i: -1, j: -1 });
    setIsSorting(false);
  };

  const getBarColor = (index: number) => {
    if (index === highlighted.i || index === highlighted.j) return "red"; // Comparing elements
    if (index === swapStep) return "orange"; // Swapped element
    return generateRandomColor(); // Random color for bars
  };

  return (
    <div className="sort-container">
      <h1 className="title">Bubble Sort Visualization</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={`Enter up to ${maxArrayLength} numbers (5-${maxValue}) separated by commas`}
          className="input"
        />
        <button type="submit" className="btn btn-submit">
          Set Array
        </button>
      </form>
      <button
        onClick={bubbleSort}
        disabled={isSorting || array.length === 0}
        className={`btn ${isSorting ? "btn-disabled" : "btn-sort"}`}
      >
        {isSorting ? "Sorting..." : "Start Sorting"}
      </button>

      {array.length > 0 && (
        <div className="bars-container">
          {array.map((value, index) => (
            <div
              key={index}
              className="bar-container"
              style={{
                height: `${(value / maxValue) * 100}%`,
                backgroundColor: getBarColor(index),
              }}
            >
              <span className="avatar">{avatars[index % avatars.length]}</span>
              <div className="bar">
                <span className="bar-label">{value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display the loop variables i and j */}
      {isSorting && (
        <div className="loop-variables">
          <p>Current i: {highlighted.i}</p>
          <p>Current j: {highlighted.j}</p>
        </div>
      )}
    </div>
  );
};

export default BubbleSortSimulation;
