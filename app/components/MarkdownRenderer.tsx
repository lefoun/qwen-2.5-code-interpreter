import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { Options as ReactMarkdownOptions } from 'react-markdown';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';

SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  return (
    <SyntaxHighlighter 
      language={language} 
      style={oneDark} 
      showLineNumbers={true}
      className="rounded text-xs overflow-x-auto"
    >
      {value}
    </SyntaxHighlighter>
  );
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const components: ReactMarkdownOptions['components'] = {
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const value = String(children).replace(/\n$/, '');

      return language ? (
        <CodeBlock
          language={language}
          value={value}
          {...props}
        />
      ) : (
        <code className="px-1 py-0.5 rounded bg-emerald-800 text-emerald-100 border border-emerald-600" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`prose prose-invert max-w-none ${className || ''}`}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
