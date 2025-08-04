# Simple Java Runner

A simplified version of JavaFiddle that allows you to write and run Java code in your browser using CheerpJ.

## Features

- **Clean Interface**: Simple, focused UI with just the essentials
- **Code Editor**: Powered by CodeMirror 6 with Java syntax highlighting
- **Instant Execution**: Run Java code directly in the browser
- **Console Output**: View program output and compilation errors

## Getting Started

### Prerequisites

- Node.js (for development)
- Modern web browser with WebAssembly support

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000`

### Usage

1. Write your Java code in the editor (default is a "Hello World" example)
2. Click the "Run Code" button or press `Ctrl/Cmd + Enter`
3. View the output in the Console and Result panels

## How It Works

This application uses:
- **CheerpJ**: A WebAssembly-based Java runtime that runs Java code in the browser
- **CodeMirror 6**: Modern code editor with Java syntax highlighting
- **Vite**: Fast build tool for development and production

The Java code is compiled and executed entirely in the browser using CheerpJ's virtual JVM.

## Differences from Original JavaFiddle

This simplified version removes:
- Svelte framework dependency
- File management system
- Sharing functionality
- Favorites system
- Settings panel
- Complex routing
- Local storage persistence


## License

Apache-2.0 (same as original JavaFiddle)
