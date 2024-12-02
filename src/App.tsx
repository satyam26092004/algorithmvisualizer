import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import SelectionSortSimulation from "./components/SelectionSort/selectionSort.tsx";
import BubbleSortSimulation from "./components/bubbleSort/bubbleSort.tsx";
import DijkstraVisualizer from "./components/dijshtras/dijshtras.tsx";
import RecursionTreeVisualizer from "./components/mergeSort/mergeSort.tsx";
import QuickSortVisualizer from "./components/quickSort/quickSort.tsx";
import KruskalVisualization from "./components/kruskal/kruskal.tsx";
import BFSVisualization from './components/bfs/bfs.tsx';
import DFSVisualization from "./components/dfs/dfs.tsx";
import GraphVisualizer from "./components/prims/prims.tsx";
import TreeTraversalVisualizer from "./components/treetraversal/traversal.tsx";
import AnimatedVisualizer from "./components/backtracking/backtracking.tsx";
import './app.css';

const algorithms = [
  { id: "selectionSort", label: "Selection Sort", component: SelectionSortSimulation },
  { id: "bubbleSort", label: "Bubble Sort", component: BubbleSortSimulation },
  { id: "dijkstra", label: "Dijkstra's Algorithm", component: DijkstraVisualizer },
  { id: "mergeSort", label: "Merge Sort", component: RecursionTreeVisualizer },
  { id: "quickSort", label: "Quick Sort", component: QuickSortVisualizer },
  { id: "kruskal", label: "Kruskal's", component: KruskalVisualization },
  { id: "bfs", label: "Breadth First Search", component: BFSVisualization },
  { id: "dfs", label: "Depth First Search", component: DFSVisualization },
  { id: "graph", label: "Prim's", component: GraphVisualizer },
  { id: "treeTraversal", label: "Tree Traversal", component: TreeTraversalVisualizer },
  { id: "animated", label: "Backtracking", component: AnimatedVisualizer },
];

const LoadingPage = ({ onLoadComplete }) => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const dotsRef = useRef([]);
  const lineRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const title = titleRef.current;
    const dots = dotsRef.current;
    const line = lineRef.current;
    const text = textRef.current;

    if (!container || !title || !line || !text || dots.length === 0) return;

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(container, {
          opacity: 0,
          duration: 0.5,
          onComplete: onLoadComplete
        });
      }
    });
    
    tl.fromTo(title,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(dots,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, stagger: 0.2, ease: "back.out(1.7)" }
    )
    .fromTo(line,
      { scaleX: 0, transformOrigin: "left" },
      { scaleX: 1, duration: 0.8, ease: "power3.inOut" }
    )
    .fromTo(text,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 }
    )
    .to({}, { duration: 1 });

    return () => tl.kill();
  }, []);

  const addDotRef = (el) => {
    if (el && !dotsRef.current.includes(el)) {
      dotsRef.current.push(el);
    }
  };

  return (
    <div ref={containerRef} className="loading-container">
      <div className="loading-content">
        <h1 ref={titleRef} className="loading-title">
          Algorithm Visualizer
        </h1>
        
        <div className="loading-dots">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              ref={addDotRef}
              className="loading-dot"
            />
          ))}
        </div>

        <div className="loading-line">
          <div ref={lineRef} className="loading-line-inner" />
        </div>

        <p ref={textRef} className="loading-text">
          Preparing your visualization experience...
        </p>
      </div>
    </div>
  );
};

const App = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithms[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const sidebarRef = useRef(null);
  const menuItemsRef = useRef([]);
  const mainContentRef = useRef(null);

  const handleSelectAlgorithm = (algorithm) => {
    setSelectedAlgorithm(algorithm);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          !event.target.closest('.toggle-button')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const menuItems = menuItemsRef.current.filter(Boolean);

    if (!sidebar || menuItems.length === 0) return;

    const ctx = gsap.context(() => {
      if (isSidebarOpen) {
        gsap.to(sidebar, { 
          x: 0, 
          duration: 0.5, 
          ease: "power2.out"
        });
        
        gsap.fromTo(menuItems,
          { opacity: 0, y: -20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.5, 
            stagger: 0.1, 
            ease: "power2.out"
          }
        );
      } else {
        gsap.to(sidebar, { 
          x: "-100%", 
          duration: 0.5, 
          ease: "power2.out"
        });
        
        gsap.to(menuItems, { 
          opacity: 0, 
          duration: 0.5 
        });
      }
    }, sidebar);

    return () => ctx.revert();
  }, [isSidebarOpen]);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    
    if (!isLoading && mainContent) {
      gsap.fromTo(mainContent,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "power2.out"
        }
      );
    }
  }, [isLoading]);

  const SelectedComponent = algorithms.find((alg) => alg.id === selectedAlgorithm)?.component;

  return (
    < >
    <div className="content">
    {isLoading ? (
        <LoadingPage onLoadComplete={() => setIsLoading(false)} />
      ) : (
        <div className="app-container">
          <button 
            className={`toggle-button ${isSidebarOpen ? 'open' : ''}`}
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <X className="icon" />
            ) : (
              "☰"
            )}
          </button>

          <div ref={sidebarRef} className="sidebar">
            <h2 className="sidebar-title">Algorithms</h2>
            {algorithms.map(({ id, label }, index) => (
              <div
                key={id}
                ref={el => menuItemsRef.current[index] = el}
                className={`menu-item ${selectedAlgorithm === id ? 'active' : ''}`}
                onClick={() => {
                  handleSelectAlgorithm(id);
                  setIsSidebarOpen(false);
                }}
              >
                {label}
              </div>
            ))}
          </div>
           <p className="title">ALGORITHM VISUALIZER</p>
          <div ref={mainContentRef} className="content">
            {SelectedComponent ? <SelectedComponent /> : <p>Select an algorithm to visualize.</p>}
          </div>
        </div>
      )}
    </div>
      
    </>
  );
};

export default App;