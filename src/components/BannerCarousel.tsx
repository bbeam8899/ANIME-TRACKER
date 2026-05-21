'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { AnimeMedia } from '@/lib/types';
import { GenreBadge } from './ui/GenreBadge';

interface BannerCarouselProps {
  mediaList: AnimeMedia[];
}

export function BannerCarousel({ mediaList }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // กรองเฉพาะเรื่องที่มี BannerImage เท่านั้น
  const validSlides = mediaList.filter(media => media.bannerImage);
  const slides = validSlides.length > 0 ? validSlides : mediaList.slice(0, 5);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 8000); // ออโต้สไลด์ทุก 8 วินาที

    return () => clearInterval(timer);
  }, [currentIndex, slides.length]);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
      setIsFading(false);
    }, 300); // หน่วงสไลด์ให้จังหวะเฟดเสร็จสิ้น
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
      setIsFading(false);
    }, 300);
  };

  if (!slides || slides.length === 0) return null;

  const currentMedia = slides[currentIndex];
  const displayTitle = currentMedia.title.english || currentMedia.title.romaji || currentMedia.title.native || 'Unknown Title';
  const score = currentMedia.averageScore ? (currentMedia.averageScore / 10).toFixed(1) : null;
  const mainStudio = currentMedia.studios?.nodes?.[0]?.name;

  return (
    <div className="relative w-full h-[380px] md:h-[520px] rounded-3xl overflow-hidden group shadow-[0_15px_50px_-15px_rgba(0,0,0,0.8)] border border-slate-800/80">
      
      {/* Background Banner Image */}
      <div className="absolute inset-0 bg-slate-950">
        <img
          src={currentMedia.bannerImage || currentMedia.coverImage.extraLarge}
          alt={displayTitle}
          className={`w-full h-full object-cover object-top transition-all duration-700 ease-in-out scale-102 ${
            isFading ? 'opacity-20 scale-100 blur-sm' : 'opacity-55 scale-102'
          }`}
        />
        {/* Overlay Masks */}
        <div className="absolute inset-0 banner-mask" />
        <div className="absolute inset-0 banner-mask-horizontal hidden md:block" />
      </div>

      {/* Slide Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-10">
        <div className={`max-w-2xl space-y-3.5 transition-all duration-300 transform ${
          isFading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          
          {/* Badges / Rating */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-red-600 text-white text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider">
              Trending Now
            </span>
            {mainStudio && (
              <span className="bg-slate-900/80 text-cyan-400 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                {mainStudio}
              </span>
            )}
            {score && (
              <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{score}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg line-clamp-2">
            {displayTitle}
          </h1>

          {/* Description */}
          {currentMedia.description && (
            <p 
              className="text-slate-300 text-xs md:text-sm line-clamp-3 leading-relaxed drop-shadow max-w-xl font-normal opacity-90"
              dangerouslySetInnerHTML={{ __html: currentMedia.description }}
            />
          )}

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {currentMedia.genres && currentMedia.genres.slice(0, 3).map((genre) => (
              <GenreBadge key={genre} genre={genre} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <Link href={`/anime/${currentMedia.id}`} className="btn-primary flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs md:text-sm">
              <Play className="w-4 h-4 fill-white" />
              <span>ดูข้อมูลเต็ม</span>
            </Link>
            <Link href={`/seasonal`} className="btn-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm">
              <Info className="w-4 h-4" />
              <span>สำรวจซีซัน</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-20 flex items-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsFading(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsFading(false);
              }, 300);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-6 bg-violet-500' : 'w-2 bg-slate-600/80 hover:bg-slate-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-300 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-300 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

    </div>
  );
}
