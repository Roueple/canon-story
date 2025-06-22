// src/hooks/useImageModal.ts
import { useEffect } from 'react'

export function useImageModal() {
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if clicked element is an image inside chapter content
      if (
        target.tagName === 'IMG' && 
        target.closest('.chapter-text-content')
      ) {
        e.preventDefault()
        
        const img = target as HTMLImageElement
        
        // Create modal overlay
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          cursor: zoom-out;
          padding: 2rem;
        `
        
        // Create modal image
        const modalImg = document.createElement('img')
        modalImg.src = img.src
        modalImg.alt = img.alt || ''
        modalImg.style.cssText = `
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `
        
        // Create close button
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '×'
        closeButton.style.cssText = `
          position: absolute;
          top: 2rem;
          right: 2rem;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 2rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `
        
        closeButton.onmouseover = () => {
          closeButton.style.background = 'rgba(255, 255, 255, 0.2)'
        }
        
        closeButton.onmouseout = () => {
          closeButton.style.background = 'rgba(255, 255, 255, 0.1)'
        }
        
        modal.appendChild(modalImg)
        modal.appendChild(closeButton)
        
        // Close on click
        modal.addEventListener('click', () => {
          modal.remove()
        })
        
        // Prevent image click from closing modal
        modalImg.addEventListener('click', (e) => {
          e.stopPropagation()
        })
        
        document.body.appendChild(modal)
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden'
        
        // Restore body scroll when modal closes
        modal.addEventListener('click', () => {
          document.body.style.overflow = ''
        })
      }
    }
    
    // Add click listener
    document.addEventListener('click', handleImageClick)
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleImageClick)
      document.body.style.overflow = ''
    }
  }, [])
}