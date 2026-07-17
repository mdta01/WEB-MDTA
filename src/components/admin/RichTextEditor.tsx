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
  linkDialogPlugin,
  HighlightToggle,
  StrikeThroughSupSubToggles,
  CodeToggle,
  tablePlugin,
  imagePlugin,
  separator,
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
      {label && label !== '' && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
        <MDXEditor
          markdown={value || ''}
          onChange={onChange}
          placeholder={placeholder || 'Tulis konten di sini...'}
          className="min-h-[220px] bg-white"
          contentEditableClassName="prose prose-sm max-w-none min-h-[180px] px-4 py-3"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            tablePlugin(),
            imagePlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <StrikeThroughSupSubToggles />
                  <HighlightToggle />
                  <CodeToggle />
                  <ListsToggle />
                  <CreateLink />
                  <separator />
                </>
              ),
            }),
          ]}
        />
      </div>
    </div>
  )
}
