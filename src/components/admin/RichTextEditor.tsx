'use client'

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  UndoRedo,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  linkPlugin,
  alignmentPlugin,
  directionPlugin,
  diffSourcePlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
}: RichTextEditorProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
        <MDXEditor
          markdown={value || ''}
          onChange={onChange}
          placeholder={placeholder || 'Tulis konten di sini...'}
          className="min-h-[200px] bg-white"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            alignmentPlugin(),
            directionPlugin(),
            diffSourcePlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <ListsToggle />
                  <CreateLink />
                </>
              ),
            }),
          ]}
        />
      </div>
    </div>
  )
}
