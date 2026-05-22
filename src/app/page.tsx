'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Calendar, Flame, Layers } from 'lucide-react';
import {
  getTrendingAnime,
  getAiringSchedule,
  getSeasonalAnimeList,
} from '@/lib/anilist';
import { BannerCarousel } from '@/components/BannerCarousel';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { AnimeCard } from '@/components/AnimeCard';
import { SearchBar } from '@/components/SearchBar';
import { getCustomAnimeList } from '@/lib/db';
import { AIAssistantButton } from '@/components/AIAssistantButton';
import Link from 'next/link';
import { getLogoPath } from '@/lib/basePath';

export default function HomePage() {
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [loading, setLoading] = useState(true);
  const [trendingAnime, setTrendingAnime] = useState<any[]>([]);
  const [airingSchedule, setAiringSchedule] = useState<any[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<any[]>([]);
  const [mergedSeasonalAnime, setMergedSeasonalAnime] = useState<any[]>([]);
  const [formattedSeason, setFormattedSeason] = useState('');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLogoUrl(getLogoPath());
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. คำนวณช่วงเวลาต้นสัปดาห์ (จันทร์) ถึงปลายสัปดาห์ (อาทิตย์) ในรูปแบบวินาที (Epoch Timestamp)
        const now = new Date();
        const currentDay = now.getDay(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const monday = new Date(now);
        monday.setDate(now.getDate() + distanceToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const weekStart = Math.floor(monday.getTime() / 1000);
        const weekEnd = Math.floor(sunday.getTime() / 1000);

        // 2. คำนวณซีซันและปีปัจจุบันตามปฏิทินจริง
        const month = now.getMonth(); // 0 = ม.ค.
        let currentSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' = 'WINTER';
        
        if (month >= 3 && month <= 5) {
          currentSeason = 'SPRING';
        } else if (month >= 6 && month <= 8) {
          currentSeason = 'SUMMER';
        } else if (month >= 9 && month <= 11) {
          currentSeason = 'FALL';
        }
        
        const year = now.getFullYear();
        setCurrentYear(year);

        // 3. ดึงข้อมูลสดจาก AniList API ขนานกัน (Parallel Fetching) เพื่อประสิทธิภาพความเร็วสูงสุด
        const [trendingData, airingData, seasonalData] = await Promise.all([
          getTrendingAnime(6),
          getAiringSchedule(weekStart, weekEnd, 1, 60),
          getSeasonalAnimeList(currentSeason, year, 12),
        ]);

        setTrendingAnime(trendingData || []);
        setAiringSchedule(airingData || []);
        setSeasonalAnime(seasonalData || []);

        // 4. ดึงข้อมูลอนิเมะ Custom ของแอดมิน และกรองเฉพาะที่อยู่ในซีซันและปีปัจจุบัน
        const customAnimeList = getCustomAnimeList() || [];
        const currentSeasonCustom = customAnimeList.filter(
          (anime) => anime.season === currentSeason && anime.seasonYear === year
        );

        // ผสานข้อมูล Custom เข้ากับรายการจาก API
        const merged = [...currentSeasonCustom, ...(seasonalData || [])];
        setMergedSeasonalAnime(merged);

        // ฟอร์แมตชื่อซีซันเป็นตัวพิมพ์แรกใหญ่
        const formatted = currentSeason.charAt(0) + currentSeason.slice(1).toLowerCase();
        setFormattedSeason(formatted);
      } catch (error) {
        console.error('Failed to load real-time homepage data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white pb-12">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-anime-bg/85 backdrop-blur-md px-4 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
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

            {/* Mobile Navigation and AI Assistant Button on Mobile */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                href="/seasonal"
                className="flex items-center space-x-1 text-xs font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-300 active:scale-95 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ตัวกรอง</span>
              </Link>
              <AIAssistantButton />
            </div>
          </div>

          {/* Real-time Search Box */}
          <div className="flex justify-center w-full md:w-auto">
            <SearchBar />
          </div>

          {/* Desktop Navigation Links & AI Button */}
          <div className="hidden md:flex items-center space-x-5">
            <nav className="flex items-center space-x-5 font-bold text-sm text-slate-300">
              <Link href="/" className="text-violet-400 flex items-center space-x-1.5 py-2 px-1 border-b-2 border-violet-500">
                <Flame className="w-4 h-4" />
                <span>แดชบอร์ด</span>
              </Link>
              <Link href="/seasonal" className="hover:text-violet-400 flex items-center space-x-1.5 py-2 px-1 border-b-2 border-transparent transition-colors">
                <Layers className="w-4 h-4" />
                <span>ตัวกรองซีซัน</span>
              </Link>
            </nav>
            <div className="border-l border-slate-800 h-6 mx-1" />
            <AIAssistantButton />
          </div>
        </div>
      </header>

      {/* 2. Main Content Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-12 flex-1 w-full animate-slide-up">
        
        {loading ? (
          /* Premium Loading Screen */
          <div className="space-y-12">
            <div className="w-full h-[400px] glass-panel border border-slate-900 rounded-3xl flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-semibold animate-pulse">กำลังโหลดข้อมูลแดชบอร์ดแบบเรียลไทม์...</p>
            </div>
            
            <div className="space-y-6">
              <div className="h-8 w-64 bg-slate-900/60 rounded-xl animate-pulse"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Banner Section */}
            <section className="w-full">
              {trendingAnime.length > 0 ? (
                <BannerCarousel mediaList={trendingAnime} />
              ) : (
                <div className="w-full h-[400px] glass-panel border border-slate-900 rounded-3xl flex items-center justify-center">
                  <p className="text-slate-400 animate-pulse font-semibold">กำลังเชื่อมต่อข้อมูล AniList API...</p>
                </div>
              )}
            </section>

            {/* Airing Schedule Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-violet-500" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                    Airing This Week <span className="text-xs md:text-sm font-semibold text-slate-400">(ตารางฉายสัปดาห์นี้)</span>
                  </h2>
                </div>
              </div>
              <WeeklySchedule scheduleItems={airingSchedule} />
            </section>

            {/* Seasonal / Popular Grid Section */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-pink-500 animate-pulse" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                    Current Season Releases <span className="text-xs md:text-sm font-semibold text-slate-400">({formattedSeason} {currentYear})</span>
                  </h2>
                </div>
                <Link
                  href="/seasonal"
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-0.5 hover:underline"
                >
                  <span>ดูข้อมูลย้อนหลัง / ล่วงหน้าทั้งหมด</span>
                  <span>→</span>
                </Link>
              </div>

              {mergedSeasonalAnime.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
                  {mergedSeasonalAnime.map((anime, idx) => (
                    <AnimeCard key={`${anime.id}-${idx}`} media={anime as any} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="h-72 bg-slate-900/60 border border-slate-800 rounded-2xl" />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-10 px-4 md:px-12 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {currentYear} Anime Tracker & Seasonal Tracker. พัฒนาด้วย Next.js 15, TypeScript และ Tailwind CSS 🎮</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <p className="opacity-70">ดึงข้อมูลลิขสิทธิ์ถูกต้องเรียลไทม์ผ่าน <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 underline">AniList API v2</a></p>
          </div>
        </div>
      </footer>

    </div>
  );
}
