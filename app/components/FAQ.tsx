import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How does code interpreter work?",
    answer: "The code interpreter uses Pyodide, a Python runtime for the browser. It allows us to execute Python code directly in your web browser without needing a server-side backend.",
  },
  {
    question: "Which model are you running?",
    answer: "We're running the Qwen2.5-Coder-1.5B-Instruct model, which is a specialized version of the Qwen language model fine-tuned for coding tasks. You can find more information about it on the Hugging Face model page: https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B",
  },
  {
    question: "What are you using to serve the model?",
    answer: "The model is served directly in the browser using WebLLM, which allows for client-side inference without the need for a dedicated server. You can learn more about WebLLM on their GitHub page: https://github.com/mlc-ai/web-llm",
  },
];

const FAQ: React.FC = () => {
  return (
    <div className="w-full max-w-8xl mt-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-emerald-100 mb-4">FAQ</h2>
      <Accordion
        type="single"
        collapsible
        className="bg-emerald-800 rounded-lg overflow-hidden"
      >
        {faqItems.map((item, index) => (
          <AccordionItem
            key={`item-${index + 1}`}
            value={`item-${index + 1}`}
            className="border-b border-emerald-700 last:border-b-0"
          >
            <AccordionTrigger className="text-emerald-100 hover:text-emerald-200 px-4 py-3 text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-emerald-200 px-4 py-2 bg-emerald-900/50">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;
