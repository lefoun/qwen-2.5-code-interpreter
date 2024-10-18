import * as webllm from "@mlc-ai/web-llm";
import { PyodideResult } from "../app/hooks/usePyodide";
import { extractCodeFromMarkdown } from "./markdownParser";

let engine: webllm.MLCEngine | null = null;
let progressCallback: ((progress: string) => void) | null = null;

export async function initializeWebLLMEngine(
  selectedModel: string,
  temperature: number,
  topP: number,
  onCompletion: () => void,
): Promise<void> {
  try {
    engine = new webllm.MLCEngine();
    engine.setInitProgressCallback(handleEngineInitProgress);

    const config = { temperature, top_p: topP };
    await engine.reload(selectedModel, config);
    onCompletion();
  } catch (error) {
    console.error("Error loading model:", error);
    throw error;
  }
}

export function setProgressCallback(
  callback: (progress: string) => void,
): void {
  progressCallback = callback;
}

function handleEngineInitProgress(report: { text: string }): void {
  if (progressCallback) {
    progressCallback(report.text);
  }
}

export async function streamingGenerating(
  messages: webllm.ChatCompletionMessageParam[],
  onUpdate: (currentMessage: string) => void,
  onFinish: (finalMessage: string, usage: webllm.CompletionUsage) => void,
  onError: (error: Error) => void,
): Promise<void> {
  if (!engine) {
    onError(new Error("Engine not initialized"));
    return;
  }

  try {
    let currentMessage = "";
    let usage: webllm.CompletionUsage | undefined;

    const completion = await engine.chat.completions.create({
      stream: true,
      messages,
      stream_options: { include_usage: true },
    });

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta.content;
      if (delta) currentMessage += delta;
      if (chunk.usage) {
        usage = chunk.usage;
      }
      onUpdate(currentMessage);
    }

    const finalMessage = await engine.getMessage();
    if (usage) {
      onFinish(finalMessage, usage as webllm.CompletionUsage);
    } else {
      throw new Error("Usage data not available");
    }
  } catch (error) {
    onError(error as Error);
  }
}

export const availableModels: string[] = webllm.prebuiltAppConfig.model_list
  .filter((model) => model.model_type !== 1 && model.model_type !== 2) // filter out embedding / vlms (https://github.com/mlc-ai/web-llm/blob/a24213cda0013e1772be7084bb8cbfdfec8af407/src/config.ts#L229-L233)
  .map((model) => model.model_id);

export interface StreamingCallbacks {
  onResultUpdate: (result: string) => void;
  onCodeOutputUpdate: (output: string | null) => void;
  onExplanationUpdate: (explanation: string | null) => void;
  onErrorUpdate: (hasError: boolean) => void;
}

export async function handleAIStreaming(
  code: string,
  runPython: (code: string) => Promise<PyodideResult>,
  callbacks: StreamingCallbacks
): Promise<void> {
  const messages = [
    {
      role: "system",
      content:
        "The user will ask you a tricky question, your job is to write Python code to answer the question. \n\n" +
        "Really think step by step before writing any code to ensure you're answering the question correctly. \n\n" +
        "Respond with a markdown code block starting with ```python and ``` at the end. Make sure the code can be executed without any changes.",
    },
    {
      role: "user",
      content: code,
    },
  ];

  try {
    await streamingGenerating(
      messages as Message[],
      (currentMessage) => {
        callbacks.onResultUpdate(currentMessage);
      },
      async (finalMessage: string, usage: unknown) => {
        callbacks.onResultUpdate(finalMessage);
        console.log("Usage:", usage);

        const extractedCode = extractCodeFromMarkdown(finalMessage);
        if (extractedCode) {
          try {
            const { results, error }: PyodideResult = await runPython(extractedCode);
            if (error) {
              callbacks.onErrorUpdate(true);
              callbacks.onCodeOutputUpdate(`Execution Error:\n${error}`);
            } else if (results) {
              callbacks.onCodeOutputUpdate(`Output:\n${results.stdout}\nResult: ${results.result}`);

              // Feed result back to LLM for explanation
              const explanationMessages = [
                ...messages,
                { role: "assistant", content: finalMessage },
                { role: "user", content: `I ran your Python code which returned ${results.result} and the printed output: ${results.stdout}.\n You should use the result and the printed output to answer the users question. No need to explain the code, just use the results to answer the question.` },
              ];

              console.log("Explanation Messages:", explanationMessages);

              await streamingGenerating(
                explanationMessages as Message[],
                (currentExplanation) => {
                  callbacks.onExplanationUpdate(currentExplanation);
                },
                (finalExplanation: string) => {
                  callbacks.onExplanationUpdate(finalExplanation);
                },
                (error: Error) => {
                  callbacks.onErrorUpdate(true);
                  callbacks.onExplanationUpdate(`Error generating explanation: ${error.message}`);
                }
              );
            }
          } catch (err) {
            callbacks.onErrorUpdate(true);
            callbacks.onCodeOutputUpdate(`Execution Error:\n${(err as Error).message}`);
          }
        }
      },
      (error: Error) => {
        callbacks.onErrorUpdate(true);
        callbacks.onResultUpdate(error.message);
      },
    );
  } catch (err) {
    callbacks.onErrorUpdate(true);
    callbacks.onResultUpdate((err as Error).message);
  }
}
