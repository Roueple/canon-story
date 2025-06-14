// src/components/admin/RichTextEditor.tsx
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

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    // Force text color on mount and value change
    if (editorRef.current) {
      editorRef.current.style.color = '#F3F4F6'
      // Apply color to all child elements
      const allElements = editorRef.current.querySelectorAll('*')
      allElements.forEach(el => {
        if (el instanceof HTMLElement && !el.style.color) {
          el.style.color = '#F3F4F6'
        }
      })
    }
  }, [value])

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInput = () => {
    if (editorRef.current) {
      // Ensure new content has proper color
      const allElements = editorRef.current.querySelectorAll('*')
      allElements.forEach(el => {
        if (el instanceof HTMLElement && !el.style.color) {
          el.style.color = '#F3F4F6'
        }
      })
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  ]

  return (
    <div className="border border-gray-600 rounded-md bg-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-600 bg-gray-800">
        {toolbarButtons.map(({ icon: Icon, command, value, title }) => (
          <button
            key={command + (value || '')}
            type="button"
            onClick={() => handleCommand(command, value)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={title}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-600 mx-1" />
        
        <button
          type="button"
          onClick={insertLink}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </button>
      </div>

      {/* Editor with forced inline styles */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[400px] p-4 focus:outline-none"
        style={{
          color: '#F3F4F6',
          backgroundColor: '#374151',
          caretColor: '#F3F4F6',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: '1.7',
          fontSize: '16px'
        }}
        suppressContentEditableWarning
        placeholder={placeholder}
      />
    </div>
  )
}