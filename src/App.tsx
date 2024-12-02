import React, { Suspense, useState, useRef, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { gsap } from "gsap";
import { X } from "lucide-react";
import './app.css';

// Lazy loaded algorithm components
const SelectionSortSimulation = React.lazy(() => import('../components/selectionSort/selectionSort'));
const BubbleSortSimulation = React.lazy(() => import("../components/BubbleSort/BubbleSort"));
const DijkstraVisualizer = React.lazy(() => import("../components/dijkstra/dijshtras"));
const RecursionTreeVisualizer = React.lazy(() => import("../components/MergeSort/MergeSort"));
const QuickSortVisualizer = React.lazy(() => import("../components/QuickSort/QuickSort"));
const KruskalVisualization = React.lazy(() => import("../components/Kruskal/Kruskal"));
const BFSVisualization = React.lazy(() => import("../components/BFS/BFS"));
const DFSVisualization = React.lazy(() => import("../components/DFS/DFS"));
const GraphVisualizer = React.lazy(() => import("../components/Prims/Prims"));
const TreeTraversalVisualizer = React.lazy(() => import("../components/TreeTraversal/Traversal"));
const AnimatedVisualizer = React.lazy(() => import("../components/Backtracking/Backtracking"));

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error, 
  resetErrorBoundary: () => void 
}) => {
  return (
    <div role="alert" className="error-fallback">
      <h2>Oops! Something went wrong</h2>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Reset Application</button>
    </div>
  );
};

// Algorithm interface
interface Algorithm {
  id: string;
  label: string;
  component: React.ComponentType;
}

// Define algorithms array
const algorithms: Algorithm[] = [
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

// Loading Page Component
interface LoadingPageProps {
  onLoadComplete: () => void;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ onLoadComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

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

    return () => { 
      tl.kill(); 
    };
  }, [onLoadComplete]);

  const addDotRef = (el: HTMLDivElement | null) => {
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

// Main App Component
const App: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(algorithms[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleSelectAlgorithm = (algorithm: string) => {
    setSelectedAlgorithm(algorithm);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Sidebar outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          !((event.target as HTMLElement).closest('.toggle-button'))) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // Sidebar animation
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const menuItems = menuItemsRef.current.filter(Boolean) as HTMLDivElement[];

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

  // Main content animation
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

  // Find selected component
  const SelectedComponent = algorithms.find((alg) => alg.id === selectedAlgorithm)?.component;

  // Global error reset handler
  const handleErrorReset = () => {
    setSelectedAlgorithm(algorithms[0].id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="content">
      {isLoading ? (
        <LoadingPage onLoadComplete={() => setIsLoading(false)} />
      ) : (
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onReset={handleErrorReset}
        >
          <Suspense fallback={<div>Loading Algorithm...</div>}>
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
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default App;