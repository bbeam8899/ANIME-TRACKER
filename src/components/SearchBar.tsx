'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Star, X, CornerDownLeft, Sparkles, Command, Tv, Layers } from 'lucide-react';
import { AnimeMedia } from '@/lib/types';
import { searchAnimeQuick } from '@/lib/anilist';
import { getCustomAnimeList } from '@/lib/db';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [featuredAnime, setFeaturedAnime] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // รอให้คอมโพเนนต์ Mount ฝั่งไคลเอนต์เสร็จสิ้นเพื่อหลีกเลี่ยง Hydration Mismatch ใน SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // โหลดอนิเมะแนะนำสำหรับแสดงเวลาผลลัพธ์ว่าง (ดึงจาก Custom DB)
  useEffect(() => {
    try {
      const customList = getCustomAnimeList() || [];
      setFeaturedAnime(customList.slice(0, 4));
    } catch (e) {
      console.error('Failed to load local featured anime', e);
    }
  }, [isOpen]);

  // การทำ Debounce 300ms สำหรับการค้นหา API
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const data = await searchAnimeQuick(query, 6);
        setResults(data || []);
        setActiveIndex(-1); // รีเซ็ตตำแหน่งเลือกคีย์บอร์ด
      } catch (err) {
        console.error('Error searching anime:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // ปิดแผงค้นหาเมื่อคลิกนอกขอบเขต
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ลงทะเบียนปุ่มคีย์ลัดสากล (Cmd+K, Ctrl+K, '/') เพื่อเปิดหน้าค้นหา Spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // เล็งโฟกัสอัตโนมัติไปที่อินพุตในกล่อง Spotlight เสมอเมื่อเปิดขึ้นมา
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 80);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
  };

  // จัดการการเลื่อนเลือกและการกดเปิดข้อมูลด้วยคีย์บอร์ด [ArrowUp, ArrowDown, Enter, Escape]
  const handleKeyDownModal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listToNavigate = query.trim() !== '' ? results : featuredAnime;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < listToNavigate.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : listToNavigate.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = activeIndex >= 0 ? listToNavigate[activeIndex] : listToNavigate[0];
      
      if (selectedItem) {
        router.push(`/anime?id=${selectedItem.id}`);
        handleClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  // รายการแนะนำด่วนเมื่อเมาส์คลิกเพื่อเริ่มค้นหา
  const hotSuggestions = [
    { text: 'ต่างโลก', icon: '🌀' },
    { text: 'Action', icon: '⚔️' },
    { text: 'Romance', icon: '💖' },
    { text: 'แฟนตาซี', icon: '🧙' },
    { text: 'Comedy', icon: '😂' },
    { text: 'ตารางฉายวันนี้', icon: '📅' }
  ];

  return (
    <div className="w-full max-w-sm md:max-w-md">
      
      {/* 1. ปุ่มทริกเกอร์ค้นหาหลักใน Header (Standout Header Trigger) */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between bg-slate-950/45 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all duration-300 rounded-2xl py-2.5 pl-4 pr-3 text-slate-450 hover:text-slate-300 font-bold group cursor-pointer"
      >
        <div className="flex items-center space-x-2.5">
          <Search className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:scale-110 transition-all duration-300" />
          <span className="text-xs md:text-sm font-semibold tracking-wide">ค้นหาอนิเมะ...</span>
        </div>
        
        {/* คีย์ลัดแสดงแบบกล่อง Premium Badge */}
        <div className="hidden sm:flex items-center space-x-0.5 bg-[#050811] border border-slate-850 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-500 group-hover:text-violet-400 group-hover:border-violet-500/25 transition-all">
          <span className="text-[9px] font-sans">⌘</span>
          <span className="font-mono">K</span>
        </div>
      </button>

      {/* 2. macOS Spotlight Search Modal Overlay */}
      {isOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-[#020408]/80 backdrop-blur-md flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4 overflow-y-auto animate-fade-in"
          onClick={handleClose}
        >
          {/* Spotlight Container */}
          <div 
            ref={containerRef}
            className="w-full max-w-2xl bg-[#080d1a]/95 border border-slate-850 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(139,92,246,0.12)] flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spotlight Input Box */}
            <div className="relative flex items-center p-1">
              <Search className="w-5.5 h-5.5 text-violet-500 absolute left-5" />
              
              <input
                ref={modalInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownModal}
                placeholder="พิมพ์ชื่อเรื่องอนิเมะ ค้นหาได้ในพริบตา..."
                className="w-full bg-transparent py-5 pl-14 pr-20 text-slate-100 placeholder-slate-550 font-bold focus:outline-none text-base md:text-lg tracking-wide"
              />

              {/* วงแหวนประมวลผล / ปุ่มลบคำค้นหา */}
              <div className="absolute right-5 flex items-center space-x-2">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                ) : query ? (
                  <button 
                    onClick={handleClear} 
                    className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                ) : (
                  <span className="text-[10px] font-black font-mono border border-slate-850 bg-slate-950 px-1.5 py-0.5 rounded text-slate-500">ESC</span>
                )}
              </div>
            </div>

            {/* แถบเส้นแยกสีรุ้งเรืองแสงสไตล์ Premium macOS Spotlight */}
            <div className="h-[1.5px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

            {/* Results & Recommendations Area */}
            <div className="flex-1 overflow-y-auto max-h-[420px] select-none">
              
              {/* กรณีที่ 1: ผู้ใช้ยังไม่ได้ป้อนคำค้นหา (แสดง Hot Searches + Featured) */}
              {query.trim() === '' ? (
                <div className="divide-y divide-slate-900/60">
                  {/* แนะนำคำสืบค้นด่วน */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-450 font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>คำค้นหายอดนิยมประจำสัปดาห์</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {hotSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(item.text);
                            modalInputRef.current?.focus();
                          }}
                          className="text-xs font-semibold px-3 py-2 bg-[#0c1122] hover:bg-violet-950/20 border border-slate-850 hover:border-violet-500/20 text-slate-300 hover:text-violet-400 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* อนิเมะแนะนำพิเศษจากระบบ */}
                  {featuredAnime.length > 0 && (
                    <div className="p-5 space-y-3">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-455 font-black uppercase tracking-wider">
                        <Tv className="w-3.5 h-3.5 text-cyan-400" />
                        <span>อนิเมะคัดสรรจากแอดมิน (Featured List)</span>
                      </div>
                      <div className="space-y-1.5">
                        {featuredAnime.map((media, idx) => {
                          const isHighlighted = activeIndex === idx;
                          const title = media.title.english || media.title.romaji || media.title.native;
                          const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
                          return (
                            <Link
                              href={`/anime?id=${media.id}`}
                              key={media.id}
                              onClick={handleClose}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-150 border-l-4 group ${
                                isHighlighted
                                  ? 'bg-violet-600/12 border-violet-500'
                                  : 'bg-[#050811]/30 hover:bg-[#070b18]/60 border-transparent'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                                <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 shadow border border-slate-850">
                                  <img src={media.coverImage.medium} alt={title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  {/* ชื่อเรื่องแสดงเต็มตัว ไม่หั่นหรือย่อทิ้ง */}
                                  <h4 className={`font-bold text-sm leading-snug whitespace-normal break-words transition-colors ${
                                    isHighlighted ? 'text-violet-400' : 'text-slate-200 group-hover:text-violet-400'
                                  }`}>
                                    {title}
                                  </h4>
                                  <p className="text-[11px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider">
                                    {media.genres?.slice(0, 2).join(' • ')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2.5 flex-shrink-0 pl-3">
                                {score && (
                                  <span className="flex items-center text-xs text-amber-400 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5 text-amber-400" />
                                    {score}
                                  </span>
                                )}
                                {isHighlighted && (
                                  <span className="text-[10px] bg-violet-600 border border-violet-500 px-1.5 py-0.5 rounded text-white flex items-center font-bold">
                                    <span>เปิด</span>
                                    <CornerDownLeft className="w-2.5 h-2.5 ml-0.5" />
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* แผงควบคุมและคีย์ลัดคีย์บอร์ด */}
                  <div className="p-4 bg-[#05070e] flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>กดปุ่มลูกศร [↑/↓] เพื่อนำทางแสนรวดเร็ว</span>
                    <span>กด [Enter] เพื่อเลือกเปิดหน้าต่างข้อมูล</span>
                  </div>
                </div>
              ) : (
                
                // กรณีที่ 2: แสดงผลลัพธ์การสืบค้นสดจากผู้ใช้
                <div>
                  {results.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-2 text-xs text-slate-450 font-black uppercase tracking-wider flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                        <span>ผลการค้นพบสำหรับ "{query}" ({results.length} เรื่อง)</span>
                      </div>
                      
                      {results.map((media, idx) => {
                        const isHighlighted = activeIndex === idx;
                        const displayTitle = media.title.english || media.title.romaji || media.title.native || 'Unknown Title';
                        const mainStudio = media.studios?.nodes?.[0]?.name;
                        const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
                        
                        return (
                          <Link
                            href={`/anime?id=${media.id}`}
                            key={media.id}
                            onClick={handleClose}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-150 border-l-4 group ${
                              isHighlighted
                                ? 'bg-violet-600/12 border-violet-500'
                                : 'bg-transparent hover:bg-[#070b18]/40 border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                              {/* ปกอนิเมะความละเอียดสูง */}
                              <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 shadow-md border border-slate-800/50">
                                {media.coverImage.large || media.coverImage.medium ? (
                                  <img
                                    src={media.coverImage.large || media.coverImage.medium}
                                    alt={displayTitle}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-slate-500">No Cover</div>
                                )}
                              </div>

                              {/* ส่วนรายละเอียดเรื่องย่อและชื่อเต็ม ( whitespace-normal break-words ไม่ย่อ ) */}
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-extrabold text-sm md:text-base leading-snug whitespace-normal break-words transition-colors ${
                                  isHighlighted ? 'text-violet-400 font-black' : 'text-slate-100 group-hover:text-violet-400'
                                }`}>
                                  {displayTitle}
                                </h4>
                                
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 text-[11px] text-slate-450 font-semibold">
                                  {mainStudio && (
                                    <span className="text-cyan-400 font-bold">{mainStudio}</span>
                                  )}
                                  {media.seasonYear && (
                                    <span>• ซีซันปี {media.seasonYear}</span>
                                  )}
                                  {score && (
                                    <span className="flex items-center text-amber-400 font-bold">
                                      <Star className="w-3 h-3 fill-amber-400 mr-0.5 text-amber-400" />
                                      {score}
                                    </span>
                                  )}
                                </div>

                                {/* แสดงประเภทคำเพื่อความโดดเด่นยิ่งขึ้น */}
                                {media.genres && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {media.genres.slice(0, 3).map((genre) => (
                                      <span key={genre} className="text-[9px] font-bold bg-[#0d1222] border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded">
                                        {genre}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ตัวนำทางเปิดด้วยคีย์บอร์ด */}
                            <div className="flex items-center flex-shrink-0 pl-3">
                              {isHighlighted && (
                                <span className="text-[10px] bg-violet-600 border border-violet-500 px-2 py-0.5 rounded text-white flex items-center font-bold">
                                  <span>เปิด</span>
                                  <CornerDownLeft className="w-3 h-3 ml-0.5" />
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    // กรณีพิมพ์แล้วแต่ไม่พบข้อมูล
                    <div className="py-14 text-center text-slate-500 text-sm font-semibold flex flex-col items-center justify-center space-y-2">
                      <span className="text-3xl">🔍</span>
                      <p>ไม่พบผลลัพธ์ของ "{query}"</p>
                      <p className="text-xs text-slate-600 font-medium">ลองเปลี่ยนคำค้นหาเป็นทับศัพท์ภาษาอังกฤษหรือภาษาโรมันจิ เช่น "Kimetsu" หรือ "Naruto" ครับ</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
