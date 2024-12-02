import React, { useState, useEffect } from "react";
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css'; // Using Okaidia theme for better colors
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import { Copy, Check } from 'lucide-react';
import "./bubble.styles.css";

const BubbleSort = () => {
  const [array, setArray] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSorting, setIsSorting] = useState(false);
  const [activeTab, setActiveTab] = useState("visualization");
  const [activeLanguage, setActiveLanguage] = useState('python');
  const [highlighted, setHighlighted] = useState({ i: -1, j: -1 });
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [activeLanguage]);

  // Reset copy status when changing language
  useEffect(() => {
    setCopiedCode(false);
  }, [activeLanguage]);

  const maxArrayLength = 12;
  const maxValue = 100;
  const minValue = 5;
  const sortingDelay = 500;

  

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeExamples[activeLanguage]);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const inputArray = inputValue
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num) && num >= minValue && num <= maxValue);

    if (inputArray.length > maxArrayLength) {
      alert(`Please enter no more than ${maxArrayLength} numbers.`);
      return;
    }

    if (inputArray.length === 0) {
      alert(`Please enter valid numbers between ${minValue} and ${maxValue}.`);
      return;
    }

    setArray(inputArray);
    setInputValue("");
    setHighlighted({ i: -1, j: -1 });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const bubbleSort = async () => {
    if (isSorting || array.length === 0) return;
    
    setIsSorting(true);
    const n = array.length;
    const newArray = [...array];

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      
      for (let j = 0; j < n - i - 1; j++) {
        setHighlighted({ i: j, j: j + 1 });
        await sleep(sortingDelay);

        if (newArray[j] > newArray[j + 1]) {
          [newArray[j], newArray[j + 1]] = [newArray[j + 1], newArray[j]];
          setArray([...newArray]);
          swapped = true;
        }
      }

      if (!swapped) break;
    }

    setHighlighted({ i: -1, j: -1 });
    setIsSorting(false);
  };

  const getBarColor = (index) => {
    if (index === highlighted.i || index === highlighted.j) {
      return "#FCD34D";
    }
    if (index > array.length - highlighted.i - 1) {
      return "#10B981";
    }
    return "#60A5FA";
  };

  const codeExamples = {
    python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
    javascript: `function bubbleSort(arr) {
    const n = arr.length;
    let swapped;
    
    do {
        swapped = false;
        for(let i = 0; i < n - 1; i++) {
            if (arr[i] > arr[i + 1]) {
                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                swapped = true;
            }
        }
    } while (swapped);
    
    return arr;
}`,
    typescript: `function bubbleSort<T>(arr: T[]): T[] {
    const n = arr.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    
    return arr;
}`
  };

  const complexityInfo = {
    timeComplexity: {
      best: "O(n) - When array is already sorted",
      average: "O(n²) - Most common case",
      worst: "O(n²) - When array is reverse sorted"
    },
    spaceComplexity: "O(1) - In-place sorting algorithm"
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "visualization":
        return (
          <section className="visualization-section">
            <div className="input-section">
              <form onSubmit={handleSubmit} className="input-form">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={`Enter up to ${maxArrayLength} numbers (${minValue}-${maxValue}) separated by commas`}
                  className="number-input"
                />
                <button type="submit" className="button submit-button">
                  Set Array
                </button>
              </form>

              <div className="value-display">
                <p>Current input: {inputValue || "No input"}</p>
                <p>Array: {array.length > 0 ? array.join(", ") : "Empty"}</p>
              </div>

              <button
                onClick={bubbleSort}
                disabled={isSorting || array.length === 0}
                className={`button sort-button ${isSorting ? 'sorting' : ''}`}
              >
                {isSorting ? "Sorting..." : "Start Sorting"}
              </button>
            </div>

            {array.length > 0 && (
              <div className="bars-container">
                {array.map((value, index) => (
                  <div
                    key={index}
                    className="bar-wrapper"
                    style={{
                      height: `${(value / maxValue) * 100}%`,
                      backgroundColor: getBarColor(index),
                    }}
                  >
                    
                    <div className="bar">
                      <span className="value-label">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSorting && (
              <div className="sorting-info">
                <p>Comparing elements at positions {highlighted.i} and {highlighted.j}</p>
              </div>
            )}
          </section>
        );

      case "explanation":
        return (
          <div className="explanation-section">
            <h2>How Bubble Sort Works</h2>
            <p>Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, 
            compares adjacent elements and swaps them if they are in the wrong order. 
            The pass through the list is repeated until no more swaps are needed.</p>
            
            <h3>Step-by-Step Process</h3>
            <ol className="steps-list">
              <li>Start with an unsorted array</li>
              <li>Compare adjacent elements (two at a time)</li>
              <li>Swap them if they are in the wrong order</li>
              <li>Repeat steps 2 and 3 until reaching the end of array</li>
              <li>The largest element "bubbles up" to the last position</li>
              <li>Repeat the process for the remaining elements</li>
            </ol>

            <div className="complexity-section">
              <h3>Time & Space Complexity</h3>
              <div className="complexity-grid">
                <div className="complexity-item">
                  <h4>Time Complexity:</h4>
                  <ul>
                    <li>Best Case: {complexityInfo.timeComplexity.best}</li>
                    <li>Average Case: {complexityInfo.timeComplexity.average}</li>
                    <li>Worst Case: {complexityInfo.timeComplexity.worst}</li>
                  </ul>
                </div>
                <div className="complexity-item">
                  <h4>Space Complexity:</h4>
                  <p>{complexityInfo.spaceComplexity}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "code":
        return (
          <div className="code-section">
            <div className="language-tabs">
              <button 
                className={`tab-button ${activeLanguage === 'python' ? 'active' : ''}`}
                onClick={() => setActiveLanguage('python')}
              >
                Python
              </button>
              <button 
                className={`tab-button ${activeLanguage === 'javascript' ? 'active' : ''}`}
                onClick={() => setActiveLanguage('javascript')}
              >
                JavaScript
              </button>
              <button 
                className={`tab-button ${activeLanguage === 'typescript' ? 'active' : ''}`}
                onClick={() => setActiveLanguage('typescript')}
              >
                TypeScript
              </button>
            </div>
            <div className="code-block-wrapper">
              <button 
                className="copy-button"
                onClick={handleCopyCode}
                title="Copy code"
              >
                {copiedCode ? <Check size={20} /> : <Copy size={20} />}
              </button>
              <pre className="code-block">
                <code className={`language-${activeLanguage}`}>
                  {codeExamples[activeLanguage]}
                </code>
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="sort-container">
      <header className="header">
        <h1 className="title">Bubble Sort Visualization</h1>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
        <button
          className={`tab ${activeTab === 'explanation' ? 'active' : ''}`}
          onClick={() => setActiveTab('explanation')}
        >
          How It Works
        </button>
        <button
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code Examples
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default BubbleSort;