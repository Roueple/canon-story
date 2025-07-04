// src/components/discovery/TrendingSlideshow.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Define the type for the novel data we expect
interface NovelData {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
  coverColor: string;
}

interface TrendingSlideshowProps {
  novels: NovelData[];
}

export function TrendingSlideshow({ novels }: TrendingSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Handle empty novels array
  if (!novels || novels.length === 0) {
    return null;
  }

  const goToPrevious = useCallback(() => {
    const isFirstSlide = currentIndex === 0
    const newIndex = isFirstSlide ? novels.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }, [currentIndex, novels.length])

  const goToNext = useCallback(() => {
    const isLastSlide = currentIndex === novels.length - 1
    const newIndex = isLastSlide ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
  }, [currentIndex, novels.length])
  
  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      goToNext()
    }, 5000) // Change slide every 5 seconds
    return () => clearTimeout(timer)
  }, [currentIndex, goToNext])

  const currentNovel = novels[currentIndex];

  return (
    <div className="h-[50vh] md:h-[500px] w-full relative group">
      <Link href={`/novels/${currentNovel.slug}`} className="w-full h-full block" aria-label={`Read ${currentNovel.title}`}>
        <div className="w-full h-full rounded-lg overflow-hidden relative bg-black">
          {/* 
            This is the two-layer image solution for vertical covers.
            1. Background: Blurred, scaled-up version of the cover.
            2. Foreground: Clean, contained version of the cover.
          */}
          {currentNovel.coverImageUrl ? (
            <>
              {/* Layer 1: Blurred Background Image */}
              <Image
                src={currentNovel.coverImageUrl}
                alt="" // Decorative, so alt text is empty
                fill
                className="object-cover transition-opacity duration-500 ease-in-out transform scale-110 blur-2xl"
                aria-hidden="true"
                quality={25} // Lower quality for blurred background is fine
              />
              {/* Darkening overlay for better text contrast */}
              <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>

              {/* Layer 2: Centered, Contained Foreground Image */}
              <div className="absolute inset-0 flex justify-center items-center p-4 md:p-8">
                <div className="relative w-full h-full max-w-[250px] md:max-w-[300px]">
                   <Image
                    src={currentNovel.coverImageUrl}
                    alt={currentNovel.title}
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority={currentIndex === 0} // Prioritize loading the first image
                  />
                </div>
              </div>
            </>
          ) : (
            // Fallback for novels without a cover image
            <div
              className="w-full h-full transition-all duration-500"
              style={{ backgroundColor: currentNovel.coverColor }}
              aria-hidden="true"
            />
          )}

          {/* Text content overlay, optimized for mobile */}
          <div className="absolute bottom-0 left-0 p-4 md:p-8">
            <h2 className="text-white text-2xl md:text-4xl font-bold drop-shadow-lg max-w-xl">
              {currentNovel.title}
            </h2>
          </div>
        </div>
      </Link>
      
      {/* Left Arrow */}
      <button onClick={goToPrevious} aria-label="Previous slide" className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-3 md:left-5 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer hover:bg-black/60 transition-colors z-10">
        <ChevronLeft size={30} />
      </button>
      {/* Right Arrow */}
      <button onClick={goToNext} aria-label="Next slide" className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-3 md:right-5 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer hover:bg-black/60 transition-colors z-10">
        <ChevronRight size={30} />
      </button>
      
      {/* Dots Navigation */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10">
        {novels.map((_, slideIndex) => (
          <button
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={cn(
              "w-2 h-2 md:w-3 md:h-3 rounded-full cursor-pointer transition-all",
              currentIndex === slideIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
            )}
            aria-label={`Go to slide ${slideIndex + 1}`}
          />
        ))}
      </div>
    </div>
  )
}