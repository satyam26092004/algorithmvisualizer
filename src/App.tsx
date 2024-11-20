import { useState } from "react";
import SelectionSortSimulation from "/components/SelectionSort/selectionSort.tsx";
import BubbleSortSimulation from "/components/bubbleSort/bubbleSort.tsx";
import DijkstraVisualizer from "/components/dijshtras/dijshtras.tsx";

const algorithms = [
  { id: "selectionSort", label: "Selection Sort", component: SelectionSortSimulation },
  { id: "bubbleSort", label: "Bubble Sort", component: BubbleSortSimulation },
  { id: "dijkstra", label: "Dijkstra's Algorithm", component: DijkstraVisualizer },
];

const App: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("selectionSort");

  const handleSelectAlgorithm = (algorithm: string) => {
    setSelectedAlgorithm(algorithm);
  };

  const SelectedComponent = algorithms.find(alg => alg.id === selectedAlgorithm)?.component;

  return (
    <div className="container">
      {/* Left Sidebar Menu */}
      <div className="sidebar">
        <h2 className="sidebar-title">Algorithms</h2>
        {algorithms.map(({ id, label }) => (
          <div
            key={id}
            className={`menu-item ${selectedAlgorithm === id ? "active" : ""}`}
            onClick={() => handleSelectAlgorithm(id)}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="content">
        {SelectedComponent && <SelectedComponent />}
      </div>
    </div>
  );
};

export default App;
