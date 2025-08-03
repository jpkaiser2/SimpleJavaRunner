'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';

interface JavaRunnerProps {
  initialCode?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Try some basic Java features
        int number = 42;
        String message = "The answer is: " + number;
        System.out.println(message);
        
        // Simple loop
        for (int i = 1; i <= 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}`;

declare global {
  function cheerpjInit(config: any): Promise<void>;
  function cheerpjCreateDisplay(width: number, height: number, parent: HTMLElement): void;
  function cheerpjRunMain(className: string, classPath: string, ...args: string[]): Promise<number>;
  function cheerpjAddStringFile(path: string, content: Uint8Array): void;
}

export default function JavaRunner({ 
  initialCode = DEFAULT_JAVA_CODE, 
  theme = 'dark',
  className = ''
}: JavaRunnerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLPreElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const [editor, setEditor] = useState<EditorView | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [cheerpjReady, setCheerpjReady] = useState(false);

  // Initialize CheerpJ
  useEffect(() => {
    const initializeCheerpJ = async () => {
      try {
        // Load CheerpJ script if not already loaded
        if (!window.cheerpjInit) {
          const script = document.createElement('script');
          script.src = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';
          script.onload = async () => {
            await window.cheerpjInit({ status: 'none' });
            if (outputRef.current) {
              window.cheerpjCreateDisplay(-1, -1, outputRef.current);
            }
            setCheerpjReady(true);
          };
          document.head.appendChild(script);
        } else {
          await window.cheerpjInit({ status: 'none' });
          if (outputRef.current) {
            window.cheerpjCreateDisplay(-1, -1, outputRef.current);
          }
          setCheerpjReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize CheerpJ:', error);
      }
    };

    initializeCheerpJ();
  }, []);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: currentCode,
      extensions: [
        basicSetup,
        java(),
        theme === 'dark' ? oneDark : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCurrentCode(update.state.doc.toString());
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    setEditor(view);

    return () => {
      view.destroy();
    };
  }, [theme]);

  const extractMainClass = useCallback((code: string): string => {
    const packageMatch = code.match(/package\s+([^;]+);/);
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    
    if (!classMatch) {
      return 'Main';
    }
    
    const className = classMatch[1];
    
    if (packageMatch) {
      const packageName = packageMatch[1].trim();
      return `${packageName}.${className}`;
    }
    
    return className;
  }, []);

  const clearConsole = useCallback(() => {
    if (consoleRef.current) {
      consoleRef.current.textContent = '';
    }
  }, []);

  const clearOutput = useCallback(() => {
    if (outputRef.current) {
      const cheerpjDisplay = document.getElementById('cheerpjDisplay');
      if (cheerpjDisplay) {
        cheerpjDisplay.innerHTML = '';
      }
    }
  }, []);

  const runCode = useCallback(async () => {
    if (!cheerpjReady || isRunning) return;

    setIsRunning(true);
    clearConsole();
    clearOutput();

    try {
      // Save the current code to CheerpJ's virtual filesystem
      const encoder = new TextEncoder();
      window.cheerpjAddStringFile('/str/Main.java', encoder.encode(currentCode));

      // Compile the Java code
      const classPath = '/app/tools.jar:/files/';
      const compileResult = await window.cheerpjRunMain(
        'com.sun.tools.javac.Main',
        classPath,
        '/str/Main.java',
        '-d',
        '/files/',
        '-Xlint'
      );

      // If compilation successful, run the program
      if (compileResult === 0) {
        const mainClass = extractMainClass(currentCode);
        await window.cheerpjRunMain(mainClass, classPath);
      } else {
        if (consoleRef.current) {
          consoleRef.current.textContent += 'Compilation failed. Check the console for details.\n';
        }
      }
    } catch (error) {
      console.error('Error running Java code:', error);
      if (consoleRef.current) {
        consoleRef.current.textContent += `Error: ${error}\n`;
      }
    } finally {
      setTimeout(() => setIsRunning(false), 1000);
    }
  }, [cheerpjReady, isRunning, currentCode, extractMainClass, clearConsole, clearOutput]);

  // Keyboard shortcut: Ctrl/Cmd + Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [runCode]);

  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-semibold">Java Runner</h1>
        <button
          onClick={runCode}
          disabled={!cheerpjReady || isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col border-r border-gray-700">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300">
            Main.java
          </div>
          <div ref={editorRef} className="flex-1 overflow-hidden" />
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Console */}
          <div className="flex-1 flex flex-col border-b border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300">
              <span>Console</span>
              <button
                onClick={clearConsole}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
            <pre
              ref={consoleRef}
              id="console"
              className="flex-1 p-4 font-mono text-sm overflow-auto bg-gray-900 text-green-400 whitespace-pre-wrap"
            />
          </div>

          {/* Result */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300">
              Result
            </div>
            <div
              ref={outputRef}
              id="output"
              className="flex-1 bg-gray-900 relative"
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isRunning && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Running Java code...</span>
          </div>
        </div>
      )}
    </div>
  );
}
