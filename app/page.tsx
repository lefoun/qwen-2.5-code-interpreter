'use client';

import { useState } from 'react';
import TypingAnimation from './components/TypingAnimation';
import { usePyodide } from './hooks/usePyodide';

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const { runPython, isLoading } = usePyodide();

  const handleRunPython = async () => {
    setResult(null);
    setHasError(false);

    try {
      const { results, error } = await runPython('import numpy as np\nresult = np.random.rand(5).tolist()\nresult');
      if (error) {
        setHasError(true);
        setResult(error);
      } else {
        setResult(JSON.stringify(results, null, 2));
      }
    } catch (err) {
      setHasError(true);
      setResult((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-900 p-4">
      <div className="font-alphaLyrae text-center mb-8">
        <h1 className="font-extrabold text-emerald-50 text-4xl sm:text-6xl">Qwen Code Interpreter</h1>
        <p className="text-emerald-200 text-xl sm:text-2xl mt-4">
          <TypingAnimation text="Qwen-2.5-Coder with access to an in-browser code interpreter." />
        </p>
      </div>
      <button
        onClick={handleRunPython}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
      >
        Run Sample Python Code
      </button>
      {isLoading && <p className="text-emerald-200 mt-4">Loading...</p>}
      {hasError && <p className="text-red-500 mt-4">Error: {result}</p>}
      {result && !hasError && (
        <div className="bg-emerald-800 p-4 rounded mt-4 w-full max-w-xl overflow-auto">
          <pre className="text-emerald-100 whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}