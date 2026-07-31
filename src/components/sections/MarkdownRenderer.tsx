'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Render markdown content (from RichTextEditor) to HTML in publik pages.
 * Supports: headings, bold, italic, lists, blockquotes, links, alignment.
 *
 * Responsive + word-break protection:
 *  - Long words/URLs break instead of overflowing container (mobile-friendly)
 *  - Responsive font sizes (text-sm mobile → text-base md+)
 *  - Kraton palette (deep emerald, teak wood, antique gold)
 *  - Proper line-height for readability
 *  - max-w-none so content fills parent container width
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null
  return (
    <div
      className={className}
      style={{
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        hyphens: 'auto' as const,
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl md:text-2xl font-bold text-[#003527] mt-5 mb-3 leading-tight font-display break-words">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg md:text-xl font-bold text-[#003527] mt-4 mb-2 leading-tight font-display break-words">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base md:text-lg font-semibold text-[#064e3b] mt-3 mb-2 leading-tight font-display break-words">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm md:text-base font-semibold text-[#064e3b] mt-3 mb-1 leading-tight font-display break-words">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-[#404944] leading-relaxed mb-3 text-sm md:text-base break-words">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 md:pl-6 mb-3 text-[#404944] text-sm md:text-base space-y-1 break-words">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 md:pl-6 mb-3 text-[#404944] text-sm md:text-base space-y-1 break-words">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#cca72f] bg-[#cca72f]/8 pl-4 pr-2 py-2 my-3 italic text-[#404944] text-sm md:text-base rounded-r-lg break-words">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#003527] hover:text-[#064e3b] underline underline-offset-2 break-all"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-[#003527]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-4 border-[#e4e2de]" />,
          code: ({ children }) => (
            <code className="bg-[#f5f3ef] text-[#895033] px-1.5 py-0.5 rounded text-xs md:text-sm font-mono break-all">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-[#f5f3ef] border border-[#e4e2de] rounded-lg p-3 md:p-4 my-3 overflow-x-auto text-xs md:text-sm">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 -mx-2 px-2">
              <table className="min-w-full border border-[#e4e2de] text-sm md:text-base">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#e4e2de] bg-[#064e3b]/10 px-2 md:px-3 py-1.5 md:py-2 text-left font-semibold text-[#003527] break-words">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#e4e2de] px-2 md:px-3 py-1.5 md:py-2 text-[#404944] break-words">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
