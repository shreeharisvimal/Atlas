import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const MarkdownEditor = ({ value, onChange, placeholder = "Enter description (Markdown supported)", rows = 8, className = "" }: MarkdownEditorProps) => {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className={`space-y-3 ${className} animate-fade-in`}>
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Description <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              !isPreview
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              isPreview
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Preview
          </button>
        </div>
      </div>
      
      {isPreview ? (
        <div className="min-h-[200px] p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 prose prose-sm dark:prose-invert max-w-none shadow-inner animate-fade-in">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                return (
                  <code className={`${className} bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100`} {...props}>
                    {children}
                  </code>
                );
              },
              pre({ children }: any) {
                return <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-600">{children}</pre>;
              },
              h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
              h2: ({ children }: any) => <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>,
              h3: ({ children }: any) => <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{children}</h3>,
              p: ({ children }: any) => <p className="mb-2 text-gray-700 dark:text-gray-300">{children}</p>,
              ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 text-gray-700 dark:text-gray-300">{children}</ul>,
              ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 text-gray-700 dark:text-gray-300">{children}</ol>,
            }}
          >
            {value || '*No content*'}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`input font-mono text-sm resize-y transition-all duration-200 ${className}`}
        />
      )}
      <div className="flex items-center justify-between text-xs">
        <p className="text-gray-500 dark:text-gray-400">
          <span className={value.length > 10000 ? 'text-red-500 font-semibold' : ''}>
            {value.length.toLocaleString()}
          </span>
          /10,000 characters
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          Markdown: <span className="font-mono">**bold**</span>, <span className="font-mono">*italic*</span>, <span className="font-mono">`code`</span>
        </p>
      </div>
    </div>
  );
};

