'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Render markdown content (from RichTextEditor) to HTML in publik pages.
 * Supports: headings, bold, italic, lists, blockquotes, links, alignment.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null
  return (
    <div className={className ?? 'prose prose-emerald max-w-none'}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-emerald-800 mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-emerald-800 mt-5 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-emerald-700 mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-gray-600 leading-relaxed mb-3 text-sm md:text-base">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-3 text-gray-600 text-sm md:text-base space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 text-gray-600 text-sm md:text-base space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 my-3 italic text-gray-600 text-sm md:text-base rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 underline">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-emerald-800">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-4 border-emerald-100" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
