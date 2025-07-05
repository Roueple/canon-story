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
      {/* Mobile View: Single prominent novel */}
      <Link href={`/novels/${currentNovel.slug}`} className="w-full h-full block md:hidden" aria-label={`Read ${currentNovel.title}`}>
        <div className="w-full h-full rounded-lg overflow-hidden relative bg-black">
          {currentNovel.coverImageUrl ? (
            <>
              <Image
                src={currentNovel.coverImageUrl}
                alt=""
                fill
                className="object-cover transition-opacity duration-500 ease-in-out transform scale-110 blur-2xl"
                aria-hidden="true"
                quality={25}
              />
              <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>
              <div className="absolute inset-0 flex justify-center items-center p-4">
                <div className="relative w-full h-full max-w-[250px]">
                   <Image
                    src={currentNovel.coverImageUrl}
                    alt={currentNovel.title}
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority={currentIndex === 0}
                  />
                </div>
              </div>
            </>
          ) : (
            <div
              className="w-full h-full transition-all duration-500"
              style={{ backgroundColor: currentNovel.coverColor }}
              aria-hidden="true"
            />
          )}
          <div className="absolute bottom-0 left-0 p-4">
            <h2 className="text-white text-2xl font-bold drop-shadow-lg max-w-xl">
              {currentNovel.title}
            </h2>
          </div>
        </div>
      </Link>

      {/* Desktop View: Three novels side-by-side */}
      <div className="hidden md:flex w-full h-full items-center justify-center relative">
        {novels.length > 1 && (
          <div className="absolute inset-0 bg-black/50" style={{ 
            backgroundImage: currentNovel.coverImageUrl ? `url(${currentNovel.coverImageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
            transform: 'scale(1.1)',
            zIndex: -1
          }} />
        )}
        <div className="flex items-center justify-center h-full w-full gap-4">
          {novels.map((novel, index) => {
            const isCurrent = index === currentIndex;
            const isPrev = index === (currentIndex - 1 + novels.length) % novels.length;
            const isNext = index === (currentIndex + 1) % novels.length;

            if (!isCurrent && !isPrev && !isNext) return null; // Only render visible novels

            return (
              <Link 
                key={novel.id} 
                href={`/novels/${novel.slug}`} 
                className={cn(
                  "relative h-[80%] aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300 ease-in-out",
                  isCurrent ? "w-[30%] z-10 shadow-lg" : "w-[20%] opacity-70 hover:opacity-100",
                  isPrev ? "-translate-x-1/2" : "",
                  isNext ? "translate-x-1/2" : ""
                )}
              >
                {novel.coverImageUrl ? (
                  <Image
                    src={novel.coverImageUrl}
                    alt={novel.title}
                    fill
                    className="object-cover"
                    sizes="20vw"
                    priority={isCurrent}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: novel.coverColor }}
                  />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                  <h3 className="text-white text-lg font-semibold line-clamp-2">{novel.title}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Left Arrow */}
      <button onClick={goToPrevious} aria-label="Previous slide" className="absolute top-1/2 -translate-y-1/2 left-3 md:left-5 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer hover:bg-black/60 transition-colors z-10">
        <ChevronLeft size={30} />
      </button>
      {/* Right Arrow */}
      <button onClick={goToNext} aria-label="Next slide" className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer hover:bg-black/60 transition-colors z-10">
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