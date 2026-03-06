import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownMessageProps {
  content: string;
  accentColor?: string;
}

export default function MarkdownMessage({ content, accentColor = "var(--neon-green)" }: MarkdownMessageProps) {
  const components: Components = {
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="text-white font-bold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-gray-300 italic">{children}</em>
    ),
    code: ({ children, className }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <code
            className="block font-mono-data text-[12px] leading-relaxed p-3 my-2 rounded overflow-x-auto"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
              boxShadow: `0 0 8px color-mix(in srgb, ${accentColor} 10%, transparent)`,
              color: accentColor,
            }}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="font-mono-data text-[12px] px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            color: accentColor,
          }}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-2 overflow-x-auto">{children}</pre>
    ),
    ul: ({ children }) => (
      <ul className="md-list space-y-1 my-2 pl-4" style={{ "--bullet-color": accentColor } as React.CSSProperties}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="md-list-ol space-y-1 my-2 pl-4 list-decimal" style={{ "--bullet-color": accentColor } as React.CSSProperties}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-gray-300 md-list-item">{children}</li>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80 transition-opacity"
        style={{ color: accentColor }}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="my-2 pl-3 italic text-gray-400"
        style={{ borderLeft: `2px solid color-mix(in srgb, ${accentColor} 40%, transparent)` }}
      >
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-bold text-white mb-1.5">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
  };

  return (
    <div className="md-message">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
