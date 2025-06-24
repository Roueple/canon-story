'use client'

import { useState } from 'react'
import { X, ChevronsUpDown } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  // FIX: Gracefully handle if options is undefined by treating it as an empty array.
  const filteredOptions = (options || []).filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOptions = (options || []).filter(option => selected.includes(option.value))

  return (
    <div className="relative w-full">
      <div
        className="flex flex-wrap gap-2 items-center p-2 border border-gray-600 bg-gray-700 rounded-md min-h-[42px] cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <Badge key={option.value} variant="primary" className="flex items-center gap-1">
              {option.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleOption(option.value)
                }}
                className="ml-1 rounded-full hover:bg-white/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-gray-400 px-1">{placeholder}</span>
        )}
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="absolute right-2 top-1/2 -translate-y-1/2">
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="px-3 py-2 text-white rounded-md cursor-pointer hover:bg-gray-700 flex items-center justify-between"
              >
                {option.label}
                {selected.includes(option.value) && (
                  <Badge size="sm" variant="success">Selected</Badge>
                )}
              </li>
            ))}
          </ul>
           <div className="p-2 border-t border-gray-700">
             <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="w-full">Close</Button>
           </div>
        </div>
      )}
    </div>
  )
}