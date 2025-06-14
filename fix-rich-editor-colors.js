// fix-rich-editor-colors.js
// Fix the rich text editor text color for dark admin theme
// Run with: node fix-rich-editor-colors.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const updatedRichTextEditor = `// src/components/admin/RichTextEditor.tsx
'use client'

import { useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Heading2,
  Heading3,
  Link,
  Image
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      handleCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      handleCommand('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      handleCommand('insertImage', url)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  ]

  return (
    <div className="border border-gray-600 rounded-md bg-gray-700">
      {/* Toolbar */}
      <div 
        ref={toolbarRef}
        className="flex items-center gap-1 p-2 border-b border-gray-600"
      >
        {toolbarButtons.map(({ icon: Icon, command, value, title }) => (
          <button
            key={command + (value || '')}
            type="button"
            onClick={() => handleCommand(command, value)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
            title={title}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-600 mx-1" />
        
        <button
          type="button"
          onClick={insertLink}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[400px] p-4 text-white focus:outline-none"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />

      <style jsx>{\`
        [contenteditable] {
          color: #F3F4F6;
        }
        
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          position: absolute;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #F9FAFB;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #F9FAFB;
        }
        
        [contenteditable] p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: #F3F4F6;
        }
        
        [contenteditable] ul, 
        [contenteditable] ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          color: #F3F4F6;
        }
        
        [contenteditable] li {
          margin-bottom: 0.5rem;
          color: #F3F4F6;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #4B5563;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #D1D5DB;
        }
        
        [contenteditable] a {
          color: #60A5FA;
          text-decoration: underline;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }
        
        /* Selection color */
        [contenteditable] ::selection {
          background-color: #3B82F6;
          color: #FFFFFF;
        }
        
        /* Cursor color */
        [contenteditable] {
          caret-color: #F3F4F6;
        }
      \`}</style>
    </div>
  )
}`;

async function updateFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    await fs.writeFile(fullPath, content);
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

async function main() {
  console.log('🎨 Fixing Rich Text Editor colors for dark theme...\n');
  
  await updateFile('src/components/admin/RichTextEditor.tsx', updatedRichTextEditor);
  
  console.log('\n✅ Rich Text Editor colors fixed!');
  console.log('\nChanges made:');
  console.log('- Set text color to white (#F3F4F6)');
  console.log('- Updated all content elements (h2, h3, p, li) to use light colors');
  console.log('- Set caret (cursor) color to white');
  console.log('- Updated selection color to match theme');
  console.log('- Removed prose classes that might override colors');
  console.log('\nRestart your dev server to see the changes.');
}

main().catch(console.error);