'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Compass, Filter, Sparkles, Layers, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { searchSeasonalAnime } from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';
import { SearchBar } from '@/components/SearchBar';
import { SeasonalFilterSelector } from '@/components/SeasonalFilterSelector';
import { getCustomAnimeList, getGenresList } from '@/lib/db';
import { AIAssistantButton } from '@/components/AIAssistantButton';
import { useSearchParams } from 'next/navigation';
import { getLogoPath, translateGenreToEnglish, hasThaiDub } from '@/lib/basePath';

function SeasonalPageContent() {
  const searchParams = useSearchParams();

  // 1. อ่านค่าพารามิเตอร์จาก URL พร้อมกำหนดค่า Default
  const now = new Date();
  const defaultYear = now.getFullYear();
  
  // ตรวจหา Season ปัจจุบัน
  const month = now.getMonth();
  let defaultSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' = 'WINTER';
  if (month >= 3 && month <= 5) defaultSeason = 'SPRING';
  else if (month >= 6 && month <= 8) defaultSeason = 'SUMMER';
  else if (month >= 9 && month <= 11) defaultSeason = 'FALL';

  const currentSeason = (searchParams.get('season')?.toUpperCase() || defaultSeason) as 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  const currentYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : defaultYear;
  const currentGenre = searchParams.get('genre') || null;
  const currentSort = searchParams.get('sort') || 'POPULARITY_DESC';
  const searchQuery = searchParams.get('search') || null;
  const thaiDubOnly = searchParams.get('thaiDub') === 'true';

  // ดึงประเภทอนิเมะทั้งหมดแบบไดนามิกจากฐานข้อมูล
  const dynamicGenres = getGenresList() || [];

  const [logoUrl, setLogoUrl] = useState('/logo.png');

  useEffect(() => {
    setLogoUrl(getLogoPath());
  }, []);

  const [loading, setLoading] = useState(true);
  const [mergedAnimeList, setMergedAnimeList] = useState<any[]>([]);

  // 2. ดึงข้อมูลสดจาก AniList API ตามตัวกรอง
  useEffect(() => {
    async function loadSeasonalData() {
      setLoading(true);
      try {
        const pageData = await searchSeasonalAnime({
          season: currentSeason,
          seasonYear: currentYear,
          genre: currentGenre ? translateGenreToEnglish(currentGenre) : null,
          search: searchQuery,
          sort: [currentSort],
          page: 1,
          perPage: 30,
        });

        const apiAnimeList = pageData?.media || [];

        // 3. ดึงข้อมูลอนิเมะ Custom และคัดกรองฝั่ง Client ตามพารามิเตอร์
        const customAnimeList = getCustomAnimeList() || [];
        const filteredCustomAnime = customAnimeList.filter(anime => {
          // กรองตาม Season และ Year
          if (anime.season !== currentSeason || anime.seasonYear !== currentYear) {
            return false;
          }
          // กรองตามประเภท (Genre)
          if (currentGenre) {
            const currentGenreEn = translateGenreToEnglish(currentGenre).toLowerCase();
            const hasGenre = anime.genres?.some(g => 
              g === currentGenre || 
              translateGenreToEnglish(g).toLowerCase() === currentGenreEn
            );
            if (!hasGenre) return false;
          }
          // กรองตามกล่องค้นหา (Search Query)
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesTitle = 
              (anime.title.english || '').toLowerCase().includes(q) ||
              (anime.title.romaji || '').toLowerCase().includes(q) ||
              (anime.title.native || '').toLowerCase().includes(q);
            const matchesDesc = (anime.description || '').toLowerCase().includes(q);
            if (!matchesTitle && !matchesDesc) {
              return false;
            }
          }
          return true;
        });

        // ผสานข้อมูลเข้าด้วยกัน
        let merged = [...filteredCustomAnime, ...apiAnimeList];

        // กรองอนิเมะที่เป็นพากย์ไทยเท่านั้นหากมีการเลือกตัวกรอง
        if (thaiDubOnly) {
          merged = merged.filter(anime => hasThaiDub(anime));
        }

        // จัดเรียงผลลัพธ์แบบรวมตามการตั้งค่าของผู้ใช้
        if (currentSort === 'POPULARITY_DESC') {
          merged.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        } else if (currentSort === 'SCORE_DESC') {
          merged.sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
        } else if (currentSort === 'TRENDING_DESC') {
          merged.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        }

        setMergedAnimeList(merged);
      } catch (error) {
        console.error('Failed to load seasonal data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSeasonalData();
  }, [currentSeason, currentYear, currentGenre, currentSort, searchQuery, thaiDubOnly]);

  // แปลงชื่อซีซันเป็นภาษาไทยเพื่อการแสดงผลสวยงาม
  const getSeasonThai = (s: string) => {
    switch (s) {
      case 'WINTER': return 'ฤดูหนาว';
      case 'SPRING': return 'ฤดูใบไม้ผลิ';
      case 'SUMMER': return 'ฤดูร้อน';
      case 'FALL': return 'ฤดูใบไม้ร่วง';
      default: return s;
    }
  };

  return (
    <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-anime-bg/85 backdrop-blur-md px-4 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-all duration-300">
                <img
                  src={logoUrl}
                  alt="Anime Tracker Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:text-violet-400 transition-colors">
                ANIME<span className="text-violet-500">TRACKER</span>
              </span>
            </Link>
            
            {/* Mobile Navigation Buttons */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                href="/"
                className="flex items-center space-x-1 text-[11px] font-bold bg-slate-900 border border-slate-800 px-2.5 py-2 rounded-xl text-slate-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>แดชบอร์ด</span>
              </Link>
              <AIAssistantButton />
            </div>
          </div>

          <div className="flex justify-center w-full md:w-auto">
            <SearchBar />
          </div>

          {/* Desktop Navigation & AI Button */}
          <div className="hidden md:flex items-center space-x-5">
            <nav className="flex items-center space-x-5 font-bold text-sm text-slate-300">
              <Link href="/" className="hover:text-violet-400 flex items-center space-x-1.5 py-2 px-1 border-b-2 border-transparent transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>แดชบอร์ด</span>
              </Link>
              <Link href="/seasonal" className="text-violet-400 flex items-center space-x-1.5 py-2 px-1 border-b-2 border-violet-500">
                <Layers className="w-4 h-4" />
                <span>ตัวกรองซีซัน</span>
              </Link>
            </nav>
            <div className="border-l border-slate-800 h-6 mx-1" />
            
            <AIAssistantButton />
          </div>
        </div>
      </header>

      {/* 2. Main content container */}
      <main className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-8 flex-1 w-full animate-slide-up">
        
        {/* Page Title & Intro */}
        <div className="space-y-2 border-b border-slate-900 pb-5">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-8 h-8 text-violet-500" />
            <span>Seasonal Anime Tracker</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl font-medium">
            สืบค้นข้อมูลอนิเมะย้อนหลังหรือล่วงหน้า พร้อมความสามารถในการคัดกรองตามซีซัน ปีการผลิต ประเภท และคะแนนรีวิวเพื่อให้คุณค้นพบอนิเมะคุณภาพเยี่ยมได้ง่ายที่สุด! 🌟
          </p>
        </div>

        {/* Filter Selector Panel (Client Component) */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800/80">
          <div className="flex items-center space-x-2 text-sm font-extrabold text-slate-200 mb-4">
            <Filter className="w-4 h-4 text-violet-400" />
            <span>ปรับแต่งตัวคัดกรองข้อมูล (Filter Panel)</span>
          </div>

          <SeasonalFilterSelector
            currentSeason={currentSeason}
            currentYear={currentYear}
            currentGenre={currentGenre}
            currentSort={currentSort}
            genres={dynamicGenres}
          />
        </div>

        {/* Anime Search Results Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center space-x-2 text-slate-200">
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
              <h3 className="font-extrabold text-base md:text-lg">
                ผลลัพธ์การค้นหา: {getSeasonThai(currentSeason)} {currentYear}
                {currentGenre && <span className="text-violet-400"> • แนว {currentGenre}</span>}
                {searchQuery && <span className="text-cyan-400"> • ค้นหา "{searchQuery}"</span>}
              </h3>
            </div>
            <span className="text-xs font-bold bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
              พบ {loading ? '...' : mergedAnimeList.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5 animate-pulse">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-72 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : mergedAnimeList.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
              {mergedAnimeList.map((anime, idx) => (
                <AnimeCard key={`${anime.id}-${idx}`} media={anime as any} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-16 border border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
              <span className="text-5xl">🔭</span>
              <h4 className="font-black text-slate-200 text-lg">ไม่พบข้อมูลอนิเมะตามตัวกรองนี้</h4>
              <p className="text-slate-400 text-sm max-w-sm">
                ทดลองปรับเปลี่ยนปี ซีซัน หรือประเภทการค้นหาอื่น ๆ เพื่อค้นพบอนิเมะเพิ่มเติมครับ!
              </p>
              <Link
                href="/seasonal"
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                ล้างฟิลเตอร์ทั้งหมด
              </Link>
            </div>
          )}
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="relative border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md mt-16 py-10 px-4 md:px-12 text-center text-xs text-slate-400 font-medium w-full overflow-hidden">
        {/* Top glowing neon border line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-violet-500/20 via-pink-500/30 to-cyan-500/20" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <p className="text-slate-300">© 2026 Anime Tracker & Seasonal Tracker. พัฒนาด้วย Next.js 16, TypeScript และ Tailwind CSS 4 🎮</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <p className="text-slate-400">ดึงข้อมูลลิขสิทธิ์ถูกต้องเรียลไทม์ผ่าน <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold underline decoration-violet-500/30 hover:decoration-violet-400">AniList API v2</a></p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function SeasonalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-anime-bg flex items-center justify-center text-slate-400 font-semibold animate-pulse">
        กำลังเชื่อมต่อตัวกรองซีซันอนิเมะ...
      </div>
    }>
      <SeasonalPageContent />
    </Suspense>
  );
}
