import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./selectionSort.module.css";

const SelectionSortSimulation: React.FC = () => {
  const [array, setArray] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [activeTab, setActiveTab] = useState<"visualization" | "code">(
    "visualization"
  );
  const [selectedLanguage, setSelectedLanguage] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const codeSnippets = [
    {
      language: "python",
      code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n-1):
        min_idx = i
        for j in range(i+1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
    },
    {
      language: "javascript",
      code: `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        }
    }
    return arr;
}`,
    },
  ];

  const generateRandomArray = () => {
    const newArray = Array.from(
      { length: 10 },
      () => Math.floor(Math.random() * 100) + 1
    );
    setArray(newArray);
  };

  const copyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(code);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const selectionSort = async () => {
    setIsSorting(true);
    const arr = [...array];

    for (let i = 0; i < arr.length - 1; i++) {
      let minIndex = i;
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j] < arr[minIndex]) {
          minIndex = j;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        setArray([...arr]);
      }

      if (minIndex !== i) {
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        setArray([...arr]);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setIsSorting(false);
  };

  useEffect(() => {
    generateRandomArray();
  }, []);

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          Selection Sort is a comparison-based sorting algorithm. It sorts an
          array by repeatedly selecting the smallest (or largest) element from
          the unsorted portion and swapping it with the first unsorted element.
          This process continues until the entire array is sorted.
          <ol>
          <li>
            First we find the smallest element and swap it with the first
            element. This way we get the smallest element at its correct
            position.
          </li>
          <li>
            Then we find the smallest among remaining elements (or second
            smallest) and move it to its correct position by swapping.
          </li>
          <li>
            We keep doing this until we get all elements moved to correct
            position.
          </li>
        </ol>
        </div>
        
        <h1>Selection Sort Visualizer</h1>
        <p>Explore the intricacies of the Selection Sort algorithm</p>
      </motion.div>

      <div className={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab("visualization")}
          className={`${styles.tabButton} ${
            activeTab === "visualization" ? styles.activeTab : ""
          }`}
        >
          Visualization
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`${styles.tabButton} ${
            activeTab === "code" ? styles.activeTab : ""
          }`}
        >
          Code Examples
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "visualization" && (
          <motion.div
            key="visualization"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.visualizationSection}
          >
            <div className={styles.arrayControls}>
              <button
                onClick={generateRandomArray}
                disabled={isSorting}
                className={styles.controlButton}
              >
                Generate New Array
              </button>
              <button
                onClick={selectionSort}
                disabled={isSorting}
                className={styles.controlButton}
              >
                {isSorting ? "Sorting..." : "Start Sorting"}
              </button>
            </div>
            <div className={styles.barContainer}>
              {array.map((value, index) => (
                <div key={index} className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${value * 3}px`,
                      backgroundColor: isSorting
                        ? `hsl(${value * 3}, 70%, 50%)`
                        : "#3B82F6",
                    }}
                  >
                    <span className={styles.barValue}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {activeTab === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.codeSection}
          >
            <div className={styles.languageSelector}>
              {codeSnippets.map((snippet, index) => (
                <button
                  key={snippet.language}
                  onClick={() => setSelectedLanguage(index)}
                  className={`${styles.languageButton} ${
                    selectedLanguage === index ? styles.activeLanguage : ""
                  }`}
                >
                  {snippet.language}
                </button>
              ))}
            </div>
            <div className={styles.codeSnippetContainer}>
              <button
                onClick={() =>
                  copyCodeSnippet(codeSnippets[selectedLanguage].code)
                }
                className={styles.copyButton}
              >
                {copiedSnippet === codeSnippets[selectedLanguage].code
                  ? "Copied!"
                  : "Copy Code"}
              </button>
              <SyntaxHighlighter
                language={codeSnippets[selectedLanguage].language}
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: "12px",
                  fontSize: "14px",
                  padding: "20px",
                }}
              >
                {codeSnippets[selectedLanguage].code}
              </SyntaxHighlighter>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectionSortSimulation;
