/// <reference lib="webworker" />

import { PyodideInterface } from "pyodide";

declare const self: DedicatedWorkerGlobalScope;

let pyodide: PyodideInterface | null = null;

interface WorkerMessage {
  id: string;
  python: string;
  packages: string[];
}

interface WorkerResponse {
  id: string;
  results?: {
    stdout: string;
    result: unknown;
  };
  error?: string;
}

self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { id, python, packages } = event.data;

  if (!pyodide) {
    self.importScripts(
      "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js",
    );

    // @ts-expect-error - to be fixed
    pyodide = await self.loadPyodide();

    if (pyodide) {
      await pyodide.loadPackage("numpy");
      await pyodide.loadPackage("pandas");
      if (packages.length > 0) {
        try {
          await pyodide.loadPackage(packages);
        } catch (e) {
          console.error(
            `Failed to load the required packages ${packages}. The code may fail to run. ${e}`
          );
        }
      }
    }
  }

  if (!pyodide) {
    throw new Error("Failed to initialize Pyodide");
  }

  try {
    pyodide.runPython(`
      import sys
      from io import StringIO
      sys.stdout = StringIO()
    `);

    const result = await pyodide.runPythonAsync(python);

    // Capture stdout content
    const stdout = pyodide.runPython("sys.stdout.getvalue()");

    // Reset stdout
    pyodide.runPython("sys.stdout = sys.__stdout__");

    // Convert result to JSON-safe format
    let jsonSafeResult;
    if (result !== undefined && result !== null) {
      try {
        jsonSafeResult = pyodide
          .toPy(result)
          .toJs({ dict_converter: Object.fromEntries });
      } catch (conversionError) {
        console.warn(
          "Failed to convert result to JSON-safe format:",
          conversionError,
        );
        jsonSafeResult = String(result);
      }
    } else {
      jsonSafeResult = null;
    }

    const response: WorkerResponse = {
      id,
      results: {
        stdout,
        result: jsonSafeResult,
      },
    };

    self.postMessage(response);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(errorResponse);
  }
});
