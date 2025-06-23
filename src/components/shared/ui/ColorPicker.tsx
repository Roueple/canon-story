'use client'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  colors: string[]
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ colors, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-8 h-8 rounded-lg border-2 transition-all',
            value.toLowerCase() === color.toLowerCase()
              ? 'border-white ring-2 ring-offset-2 ring-offset-gray-800 ring-white'
              : 'border-transparent hover:border-gray-400'
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  )
}