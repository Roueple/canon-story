// src/components/admin/RichTextEditor.tsx
'use client'
import { useRef, useState, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3, Link, Image as ImageIcon, Upload } from 'lucide-react';
import { MediaModal } from '@/components/admin/media/MediaModal';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMediaModalOpen, setMediaModalOpen] = useState(false);

  useEffect(() => {
      if (editorRef.current && value !== editorRef.current.innerHTML) {
          editorRef.current.innerHTML = value;
      }
  }, [value]);

  const handleCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      onChange(editorRef.current?.innerHTML || '');
  };

  const handleImageSelect = (media: any) => {
      const imgTag = `<img src="${media.url}" alt="${media.altText || ''}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" />`;
      handleCommand('insertHTML', imgTag);
      setMediaModalOpen(false);
  };

  const handleInput = () => onChange(editorRef.current?.innerHTML || '');

  return (
    <div className="border border-gray-600 rounded-md bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b border-gray-600 flex-wrap bg-gray-700">
          <button type="button" onClick={() => handleCommand('bold')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Bold"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleCommand('italic')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Italic"><Italic className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button type="button" onClick={() => handleCommand('formatBlock', 'h2')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Heading 2"><Heading2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleCommand('formatBlock', 'h3')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Heading 3"><Heading3 className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Bullet List"><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleCommand('insertOrderedList')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Numbered List"><ListOrdered className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button type="button" onClick={() => setMediaModalOpen(true)} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Insert Image"><ImageIcon className="h-4 w-4" /></button>
      </div>
      <div ref={editorRef} contentEditable onInput={handleInput} className="min-h-[400px] p-4 focus:outline-none prose prose-invert max-w-none" style={{caretColor: '#F3F4F6'}} suppressContentEditableWarning data-placeholder={placeholder} />
      <MediaModal isOpen={isMediaModalOpen} onClose={() => setMediaModalOpen(false)} onSelect={handleImageSelect} />
    </div>
  );
}