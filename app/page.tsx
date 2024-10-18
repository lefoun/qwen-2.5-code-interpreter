"use client";

import { useState, useEffect } from "react";
import TypingAnimation from "./components/TypingAnimation";
import { usePyodide } from "./hooks/usePyodide";
import { Input } from "@/components/ui/input";
import { initializeWebLLMEngine, setProgressCallback } from "../lib/llm";
import ProgressBox from "./components/ProgressBox";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleAIStreaming } from "../lib/llm";

export default function Home() {
  const [userInput, setUserInput] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [resultExplanation, setResultExplanation] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const { runPython, isLoading: isPyodideLoading } = usePyodide();
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  useEffect(() => {
    setProgressCallback(setLoadingProgress);
  }, []);

  const handleLoadModel = async () => {
    setIsModelLoading(true);
    try {
      await initializeWebLLMEngine(
        "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
        0.7,
        1,
        () => {
          setIsModelLoaded(true);
          setLoadingProgress("Model loaded successfully");
        },
      );
    } catch (err) {
      setHasError(true);
      setResult((err as Error).message);
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isModelLoaded || isStreaming) return;

    setIsStreaming(true);
    setResult("");
    setResultExplanation("");
    setCodeOutput(null);
    setHasError(false);

    try {
      await handleAIStreaming(
        userInput,
        runPython,
        {
          onResultUpdate: setResult,
          onCodeOutputUpdate: setCodeOutput,
          onExplanationUpdate: setResultExplanation,
          onErrorUpdate: setHasError,
        }
      );
    } catch (err) {
      setHasError(true);
      setResult((err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-emerald-900">
      <main className="flex-grow flex flex-col items-center justify-center p-4 min-h-screen">
        <div className="font-alphaLyrae text-center mb-8">
          <h1 className="font-extrabold text-emerald-50 text-4xl sm:text-6xl">
            Qwen Code Interpreter
          </h1>
          <p className="text-emerald-200 text-xl sm:text-2xl mt-4">
            <TypingAnimation speed={60} text="Qwen-2.5-Coder 1.5B with access to an in-browser code interpreter." />
          </p>
        </div>

        {!isModelLoaded && (
          <Button
            onClick={handleLoadModel}
            disabled={isPyodideLoading || isModelLoading}
            className="mb-4 font-alphaLyrae px-6 py-6 bg-emerald-600 text-emerald-100 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out font-semibold text-lg shadow-md"
          >
            {isModelLoading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-100" />
                Loading...
              </span>
            ) : (
              "Load AGI Mini 1.5B"
            )}
          </Button>
        )}

        {loadingProgress && !isModelLoaded && (
          <ProgressBox progress={loadingProgress} />
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-4">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-8 font-mono text-sm bg-emerald-800 text-emerald-100 border-emerald-600 focus:ring-emerald-500 focus:border-emerald-500 rounded-md resize-none placeholder:text-emerald-300/70"
            placeholder="How many r's are in 'strawberry'?"
            disabled={!isModelLoaded || isStreaming}
          />
        </form>

        {isStreaming && (
          <p className="text-emerald-200 mt-4">Streaming response...</p>
        )}
        {hasError && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-md mt-4 w-full max-w-2xl">
            <h3 className="text-red-200 font-semibold mb-2">Error:</h3>
            <pre className="text-red-100 whitespace-pre-wrap text-sm">
              {result}
            </pre>
          </div>
        )}
        {result && !hasError && (
          <div className="bg-emerald-800 p-4 rounded-t mt-4 w-full max-w-2xl overflow-auto">
            <pre className="text-emerald-100 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        {codeOutput && (
          <div className="bg-teal-800 p-4 w-full max-w-2xl overflow-auto border-t border-teal-700">
            <h3 className="text-teal-200 font-semibold mb-2">Code Output:</h3>
            <pre className="text-teal-50 whitespace-pre-wrap text-sm font-mono bg-teal-900 p-3 rounded">{codeOutput}</pre>
          </div>
        )}
        {resultExplanation && (
          <div className="bg-emerald-700 p-4 rounded-b w-full max-w-2xl overflow-auto border-t border-emerald-600">
            <h3 className="text-emerald-200 font-semibold mb-2">Explanation:</h3>
            <pre className="text-emerald-50 whitespace-pre-wrap text-sm">{resultExplanation}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
