import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';

class SimpleJavaRunner {
    constructor() {
        this.isRunning = false;
        this.editor = null;
        this.currentCode = this.getDefaultJavaCode();
        
        this.initializeEditor();
        this.initializeCheerpJ();
        this.setupEventListeners();
    }

    getDefaultJavaCode() {
        return `public class Main {
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
    }

    initializeEditor() {
        const editorElement = document.getElementById('editor');
        
        const state = EditorState.create({
            doc: this.currentCode,
            extensions: [
                basicSetup,
                java(),
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        this.currentCode = update.state.doc.toString();
                    }
                })
            ]
        });

        this.editor = new EditorView({
            state,
            parent: editorElement
        });
    }

    async initializeCheerpJ() {
        try {
            // Check if CheerpJ functions are available
            if (typeof cheerpjInit === 'undefined') {
                throw new Error('CheerpJ not loaded. Please check your internet connection.');
            }
            
            await cheerpjInit({
                status: 'none',
            });
            
            const display = document.getElementById("output");
            if (!display) {
                throw new Error('Output display element not found');
            }
            
            cheerpjCreateDisplay(-1, -1, display);
            
            console.log('CheerpJ initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CheerpJ:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError('Failed to initialize Java runtime: ' + errorMessage);
        }
    }

    setupEventListeners() {
        const runBtn = document.getElementById('runBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runCode());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearConsole());
        }
        
        // Keyboard shortcut: Ctrl/Cmd + Enter to run
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    }

    async runCode() {
        if (this.isRunning) return;

        this.setRunning(true);
        this.clearConsole();
        this.clearOutput();

        try {
            // Save the current code to CheerpJ's virtual filesystem
            const encoder = new TextEncoder();
            cheerpjAddStringFile('/str/Main.java', encoder.encode(this.currentCode));

            // Compile the Java code - use the full path to tools.jar
            const classPath = '/app/tools.jar:/files/';
            const compileResult = await cheerpjRunMain(
                'com.sun.tools.javac.Main',
                classPath,
                '/str/Main.java',
                '-d',
                '/files/',
                '-Xlint'
            );

            // If compilation successful, run the program
            if (compileResult === 0) {
                const mainClass = this.extractMainClass(this.currentCode);
                await cheerpjRunMain(mainClass, classPath);
            } else {
                this.showError('Compilation failed. Check the console for details.');
            }
        } catch (error) {
            console.error('Error running Java code:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError('Runtime error: ' + errorMessage);
        } finally {
            // The running state will be cleared by the mutation observer
            // or we'll clear it manually after a timeout
            setTimeout(() => {
                if (this.isRunning) {
                    this.setRunning(false);
                }
            }, 1000);
        }
    }

    extractMainClass(code) {
        // Extract package name if present
        const packageMatch = code.match(/package\s+([^;]+);/);
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        
        if (!classMatch) {
            return 'Main'; // fallback
        }
        
        const className = classMatch[1];
        
        if (packageMatch) {
            const packageName = packageMatch[1].trim();
            return `${packageName}.${className}`;
        }
        
        return className;
    }

    setRunning(running) {
        this.isRunning = running;
        const runBtn = document.getElementById('runBtn');
        const loading = document.getElementById('loading');
        
        if (runBtn && runBtn instanceof HTMLButtonElement) {
            runBtn.disabled = running;
            runBtn.textContent = running ? 'Running...' : 'Run Code';
        }
        
        if (loading) {
            if (running) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    }

    clearConsole() {
        const console = document.getElementById('console');
        if (console) {
            console.textContent = '';
        }
    }

    clearOutput() {
        const output = document.getElementById('output');
        const cheerpjDisplay = document.getElementById('cheerpjDisplay');
        if (cheerpjDisplay) {
            cheerpjDisplay.innerHTML = '';
        }
    }

    showError(message) {
        const console = document.getElementById('console');
        if (console) {
            console.textContent += `Error: ${message}\n`;
        }
    }

    setupMutationObserver() {
        const console = document.getElementById('console');
        const output = document.getElementById('output');
        
        // Monitor console and output for changes to detect when execution is complete
        const observer = new MutationObserver(() => {
            if (this.isRunning) {
                this.setRunning(false);
            }
        });
        
        if (console) {
            observer.observe(console, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
        if (output) {
            observer.observe(output, {
                childList: true,
                subtree: true
            });
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SimpleJavaRunner();
    
    // Set up mutation observer after a brief delay to ensure CheerpJ is ready
    setTimeout(() => {
        app.setupMutationObserver();
    }, 1000);
});
