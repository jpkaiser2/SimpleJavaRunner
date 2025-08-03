# Next.js Integration Guide

This guide shows how to integrate the Simple Java Runner into your Next.js application.

## Installation

1. Install the required dependencies in your Next.js project:

```bash
npm install @codemirror/commands @codemirror/lang-java @codemirror/language @codemirror/state @codemirror/theme-one-dark @codemirror/view codemirror
```

2. Copy the `JavaRunner.tsx` component to your components directory
3. Copy the `tools.jar` file to your `public` directory

## Usage

### Basic Usage

```tsx
import JavaRunner from '@/components/JavaRunner';

export default function CodeEditorPage() {
  return (
    <div className="h-screen">
      <JavaRunner />
    </div>
  );
}
```

### Custom Configuration

```tsx
import JavaRunner from '@/components/JavaRunner';

const customCode = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello from Next.js!");
    }
}
`;

export default function CodeEditorPage() {
  return (
    <div className="h-screen">
      <JavaRunner 
        initialCode={customCode}
        theme="light"
        className="border rounded-lg"
      />
    </div>
  );
}
```

## Important Notes

### 1. Client-Side Only

The JavaRunner component must run on the client side only due to CheerpJ's browser dependencies. The component already uses `'use client'` directive.

### 2. tools.jar File

Make sure to place the `tools.jar` file in your `public` directory. CheerpJ needs this file to compile Java code.

### 3. HTTPS Requirement

CheerpJ requires HTTPS in production. Make sure your deployment supports HTTPS.

### 4. Memory Considerations

CheerpJ loads a full JVM in the browser, which requires significant memory. Consider:
- Lazy loading the component
- Providing loading states
- Warning users about memory requirements

### 5. CSP Headers

If you use Content Security Policy, you may need to adjust headers to allow CheerpJ to load and execute.

## Advanced Integration

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const JavaRunner = dynamic(() => import('@/components/JavaRunner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading Java Runtime...</p>
      </div>
    </div>
  )
});

export default function CodeEditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JavaRunner />
    </Suspense>
  );
}
```

### With State Management

```tsx
'use client';

import { useState } from 'react';
import JavaRunner from '@/components/JavaRunner';

export default function CodeEditorPage() {
  const [code, setCode] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleRunComplete = (output: string) => {
    setResults(prev => [...prev, output]);
  };

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <JavaRunner 
          initialCode={code}
          onCodeChange={handleCodeChange}
          onRunComplete={handleRunComplete}
        />
      </div>
      <div className="w-80 bg-gray-100 p-4">
        <h3 className="font-bold mb-2">Previous Results</h3>
        {results.map((result, i) => (
          <div key={i} className="mb-2 p-2 bg-white rounded text-sm">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Deployment

### Vercel

Works out of the box. Make sure `tools.jar` is in your `public` directory.

### Netlify

Same as Vercel - should work without additional configuration.

### Self-hosted

Ensure your server serves the `tools.jar` file with the correct MIME type and CORS headers if needed.

## Troubleshooting

### Common Issues

1. **CheerpJ fails to load**: Check browser console for CORS errors or missing files
2. **Compilation fails**: Ensure `tools.jar` is accessible at `/tools.jar`
3. **Performance issues**: CheerpJ is resource-intensive; consider showing warnings to users
4. **Mobile compatibility**: CheerpJ may not work well on mobile devices

### Browser Support

- Chrome/Chromium: Full support
- Firefox: Full support  
- Safari: Partial support (may have issues)
- Mobile browsers: Limited/no support

## Example Project Structure

```
your-nextjs-app/
├── public/
│   └── tools.jar              # Java compiler
├── src/
│   ├── components/
│   │   └── JavaRunner.tsx     # Main component
│   └── app/
│       └── editor/
│           └── page.tsx       # Your page using the component
└── package.json
```
