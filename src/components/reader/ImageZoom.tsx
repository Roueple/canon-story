'use client'

import { useEffect } from 'react';
import { X } from 'lucide-react';

export function useImageZoom() {
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'IMG' && target.closest('.prose')) {
        e.preventDefault();
        
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        
        const img = document.createElement('img');
        img.src = (target as HTMLImageElement).src;
        img.alt = (target as HTMLImageElement).alt || 'Zoomed image';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70';
        closeButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        
        modal.appendChild(img);
        modal.appendChild(closeButton);
        
        modal.addEventListener('click', () => {
          modal.remove();
        });
        
        document.body.appendChild(modal);
      }
    };
    
    document.addEventListener('click', handleImageClick);
    
    return () => {
      document.removeEventListener('click', handleImageClick);
    };
  }, []);
}
