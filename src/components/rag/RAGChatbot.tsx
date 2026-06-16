import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Brain, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  X 
} from 'lucide-react';
import './RAGChatbot.css';

// TypeScript Interfaces
interface Citation {
  title: string;
  author?: string;
  page?: string | number;
  snippet: string;
  source?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  timestamp: Date;
  citations?: Citation[];
  isError?: boolean;
}

interface RAGChatbotProps {
  selectedAlgorithm: string;
  algorithmLabel: string;
}

// Configured suggested questions for each algorithm
const customSuggestions: Record<string, string[]> = {
  selectionSort: [
    "Explain the space complexity of Selection Sort.",
    "Why is Selection Sort considered unstable?",
    "Compare Selection Sort and Bubble Sort."
  ],
  bubbleSort: [
    "What is the average-case time complexity of Bubble Sort?",
    "How can we optimize Bubble Sort to stop early?",
    "When is Bubble Sort preferred over other algorithms?"
  ],
  dijkstra: [
    "How does Dijkstra's Algorithm handle negative weight edges?",
    "What is the time complexity of Dijkstra with a binary heap?",
    "Explain the difference between Dijkstra and Prim's algorithm."
  ],
  mergeSort: [
    "Why is Merge Sort preferred for sorting linked lists?",
    "Explain the divide-and-conquer approach of Merge Sort.",
    "What is the space complexity of Merge Sort?"
  ],
  quickSort: [
    "Why is Quick Sort faster than Merge Sort in practice?",
    "How does the choice of pivot affect Quick Sort performance?",
    "What is the worst-case complexity of Quick Sort and how to avoid it?"
  ],
  kruskal: [
    "How does Kruskal's algorithm use the Union-Find data structure?",
    "Explain the greedy choice property of Kruskal's.",
    "Compare Kruskal's and Prim's algorithms."
  ],
  bfs: [
    "What queue data structure is used in BFS?",
    "How does BFS find the shortest path in an unweighted graph?",
    "Explain the difference between BFS and DFS traversal."
  ],
  dfs: [
    "How does DFS use the call stack or recursion?",
    "What are the applications of DFS (e.g. topological sorting)?",
    "Explain the classification of edges in DFS (tree, back, forward, cross)."
  ],
  graph: [
    "How does Prim's algorithm construct a Minimum Spanning Tree?",
    "What is the time complexity of Prim's using a Fibonacci Heap?",
    "Can Prim's algorithm run on a disconnected graph?"
  ],
  treeTraversal: [
    "Explain the difference between Inorder, Preorder, and Postorder traversal.",
    "How does level-order traversal relate to BFS?",
    "Write the recursive formulas for Binary Tree Traversals."
  ],
  animated: [
    "Explain the concept of pruning in backtracking.",
    "How is backtracking different from simple DFS?",
    "Explain how backtracking solves the N-Queens problem."
  ]
};

const defaultSuggestions = [
  "What is the difference between a stack and a queue?",
  "Explain Big-O notation with examples.",
  "What is a hash collision and how is it resolved?"
];

// Helper to format source file names (removes directory path)
const formatSourceFile = (path?: string): string => {
  if (!path) return 'Textbook Source';
  const parts = path.split('/');
  return parts[parts.length - 1];
};

export const RAGChatbot: React.FC<RAGChatbotProps> = ({ selectedAlgorithm, algorithmLabel }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Toggle thought expansion
  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Handle message send via FastAPI background task polling
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 1. Append user message
    const userMessageId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api-backend';

    try {
      // 2. Submit task to background queue
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: text,
          selected_algorithm: selectedAlgorithm,
          algorithm_label: algorithmLabel,
          model: activeModel
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to submit query to background queue');
      }

      const { job_id } = await response.json();

      // 3. Poll status endpoint until finished or failed
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes timeout
      
      const pollStatus = async (): Promise<any> => {
        if (attempts >= maxAttempts) {
          throw new Error('Query timed out. The request took too long to process in the background.');
        }
        attempts++;

        const statusRes = await fetch(`${backendUrl}/api/chat/status/${job_id}`);
        if (!statusRes.ok) {
          throw new Error('Failed to fetch background task status from server.');
        }

        const data = await statusRes.json();
        const status = data.status;

        if (status === 'finished') {
          return data.result;
        } else if (status === 'failed') {
          throw new Error(data.error || 'Background task failed to process.');
        } else {
          // Still processing: wait 1 second and poll again
          await new Promise(resolve => setTimeout(resolve, 1000));
          return pollStatus();
        }
      };

      const result = await pollStatus();

      // 4. Append assistant response
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: result.content,
        thought: result.thought || undefined,
        timestamp: new Date(),
        citations: result.citations && result.citations.length > 0 ? result.citations : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (result.thought) {
        setExpandedThoughts(prev => ({ ...prev, [assistantMsgId]: true }));
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: `Error: ${err.message || 'An unexpected error occurred while communicating with the background task queue.'}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom regex based markdown parser
  const renderFormattedMessage = (text: string) => {
    if (!text) return null;
    
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return (
          <pre key={index} className="rag-code-block">
            {language && <div className="rag-code-lang">{language}</div>}
            <code>{code.trim()}</code>
          </pre>
        );
      }
      
      const lines = part.split('\n');
      return lines.map((line, lineIdx) => {
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().substring(2);
          return (
            <ul key={`${index}-${lineIdx}`} className="rag-list">
              <li>{parseInlineStyles(content)}</li>
            </ul>
          );
        }
        if (line.trim().match(/^\d+\.\s/)) {
          const content = line.trim().replace(/^\d+\.\s/, '');
          return (
            <ol key={`${index}-${lineIdx}`} className="rag-ordered-list">
              <li>{parseInlineStyles(content)}</li>
            </ol>
          );
        }
        
        return (
          <p key={`${index}-${lineIdx}`} className="rag-text-para">
            {line.trim() === '' ? <span style={{ display: 'block', height: '8px' }} /> : parseInlineStyles(line)}
          </p>
        );
      });
    });
  };

  const parseInlineStyles = (line: string) => {
    const tokens = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={i}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return <code key={i}>{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  // Get active suggested questions
  const suggestions = customSuggestions[selectedAlgorithm] || defaultSuggestions;

  return (
    <>
      {/* Floating Trigger Button */}
      <button 
        className="rag-chatbot-trigger" 
        onClick={() => setIsOpen(prev => !prev)}
        title="Ask DSA AI Tutor"
        id="dsa-ai-tutor-trigger"
      >
        <MessageSquare className="icon" />
        {messages.length === 0 && !isOpen && (
          <span className="rag-chatbot-badge">AI</span>
        )}
      </button>

      {/* Chatbot Slide-in Drawer */}
      <div className={`rag-chatbot-panel ${isOpen ? 'open' : ''}`} id="dsa-ai-tutor-panel">
        {/* Header */}
        <div className="rag-chatbot-header">
          <div className="rag-chatbot-header-title">
            <h3><Sparkles style={{ width: '16px', height: '16px', color: '#a855f7' }} /> DSA AI Assistant</h3>
            <p>Retrieving from RAG collection: <strong>{algorithmLabel}</strong></p>
          </div>
          <div className="rag-chatbot-controls">
            <select 
              className="rag-chatbot-model-select"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value as 'gpt-4o-mini' | 'gpt-4o')}
              title="Select LLM Model"
            >
              <option value="gpt-4o-mini">GPT-4o-mini (Fast)</option>
              <option value="gpt-4o">GPT-4o (Smart)</option>
            </select>
            <button 
              className="rag-chatbot-close-btn" 
              onClick={() => setIsOpen(false)}
              title="Close Tutor"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Messages and Content */}
        <div className="rag-chatbot-messages">
          {messages.length === 0 ? (
            <div className="rag-chatbot-welcome">
              <div className="rag-chatbot-welcome-icon">
                <Brain style={{ width: '32px', height: '32px' }} />
              </div>
              <h4>Ask the DSA AI Tutor</h4>
              <p>
                Get expert explanations on data structures, complexity analyses, and execution details. 
                Answers are backed by textbook source materials indexed in your vector database.
              </p>
              
              <div className="rag-chatbot-suggestions">
                <p style={{ textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#818cf8', margin: '0 0 6px 0' }}>
                  SUGGESTIONS FOR {algorithmLabel.toUpperCase()}:
                </p>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="rag-chatbot-suggestion-btn"
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    <span>{suggestion}</span>
                    <span className="arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`rag-message-wrapper ${msg.role}`}>
                {/* Expandable thought block for reasoning */}
                {msg.role === 'assistant' && msg.thought && (
                  <div className="rag-thought-container">
                    <div 
                      className="rag-thought-header" 
                      onClick={() => toggleThought(msg.id)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Brain style={{ width: '13px', height: '13px', color: '#c084fc' }} /> 
                        Reasoning Process
                      </span>
                      {expandedThoughts[msg.id] ? <ChevronUp style={{ width: '13px', height: '13px' }} /> : <ChevronDown style={{ width: '13px', height: '13px' }} />}
                    </div>
                    {expandedThoughts[msg.id] && (
                      <div className="rag-thought-content">
                        {msg.thought}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Message Text */}
                <div className={`rag-message ${msg.isError ? 'error' : ''}`}>
                  {renderFormattedMessage(msg.content)}
                  
                  {/* Sources / Citations */}
                  {msg.role === 'assistant' && msg.citations && (
                    <div className="rag-citations">
                      <div className="rag-citations-title">
                        <BookOpen style={{ width: '11px', height: '11px' }} /> Sources & Citations
                      </div>
                      <div className="rag-citations-list">
                        {msg.citations.map((cite, cIdx) => (
                          <div key={cIdx} className="rag-citation-badge">
                            [Doc {cIdx + 1}] {formatSourceFile(cite.source)} (p. {cite.page})
                            <div className="rag-citation-tooltip">
                              <div className="rag-citation-tooltip-header">
                                {cite.title} {cite.author ? `by ${cite.author}` : ''}
                              </div>
                              <div className="rag-citation-tooltip-text">
                                "{cite.snippet.substring(0, 180)}..."
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <span className="rag-message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="rag-message-wrapper assistant loading">
              <div className="rag-message">
                <div className="rag-typing-dots">
                  <div className="rag-typing-dot"></div>
                  <div className="rag-typing-dot"></div>
                  <div className="rag-typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form 
          className="rag-chatbot-input-form" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
        >
          <div className="rag-chatbot-input-row">
            <input
              type="text"
              className="rag-chatbot-input"
              placeholder={`Ask about ${algorithmLabel}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="rag-chatbot-send-btn" 
              disabled={!inputMessage.trim() || isLoading}
              title="Send Message"
            >
              <Send className="icon" />
            </button>
          </div>
          <p className="rag-chatbot-footer-note">
            Powered by RAG Collection on Qdrant Cloud.
          </p>
        </form>
      </div>
    </>
  );
};
