'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Loader2, Star, X } from 'lucide-react';
import { AnimeMedia } from '@/lib/types';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // การทำ Debounce 300ms ในการดึงข้อมูลเพื่อถนอม API Rate Limits
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error searching anime:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // ดีเลย์ 300ms

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // ปิด Dropdown เมื่อคลิกนอกขอบเขต Component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg z-50">
      
      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="ค้นหาอนิเมะเรื่องโปรดของคุณที่นี่..."
          className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-2xl py-3 pl-12 pr-10 text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-300 shadow-inner focus:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-500" />
        </div>

        {/* Loading Spinner / Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
          ) : query ? (
            <button onClick={handleClear} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Dropdown Dropdown */}
      {isOpen && (query.trim() !== '') && (
        <div className="absolute top-full mt-2 w-full glass-panel border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden max-h-[380px] overflow-y-auto animate-fade-in">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-800/60">
              {results.map((media) => {
                const displayTitle = media.title.english || media.title.romaji || media.title.native || 'Unknown Title';
                const mainStudio = media.studios?.nodes?.[0]?.name;
                const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
                
                return (
                  <Link
                    href={`/anime/${media.id}`}
                    key={media.id}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3.5 p-3 hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
                      {media.coverImage.large || media.coverImage.medium ? (
                        <img
                          src={media.coverImage.large || media.coverImage.medium}
                          alt={displayTitle}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-slate-500">
                          No Cover
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-200 group-hover:text-violet-400 transition-colors truncate">
                        {displayTitle}
                      </h4>
                      <div className="flex items-center space-x-2.5 mt-0.5 text-xs text-slate-400">
                        {mainStudio && (
                          <span className="text-cyan-400 truncate max-w-[150px]">{mainStudio}</span>
                        )}
                        {media.seasonYear && (
                          <span>• {media.seasonYear}</span>
                        )}
                        {score && (
                          <span className="flex items-center text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                            {score}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              {!isLoading ? (
                <p>ไม่พบผลลัพธ์ของ "{query}" 🔍</p>
              ) : (
                <p>กำลังค้นหาข้อมูล...</p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
