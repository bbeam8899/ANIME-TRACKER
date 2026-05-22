'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Calendar, Layers, Sliders } from 'lucide-react';

interface SeasonalFilterSelectorProps {
  currentSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  currentYear: number;
  currentGenre: string | null;
  currentSort: string;
  genres: string[];
}

const SEASONS = [
  { value: 'WINTER', label: 'ฤดูหนาว ❄️', color: 'hover:border-cyan-500 hover:text-cyan-400' },
  { value: 'SPRING', label: 'ฤดูใบไม้ผลิ 🌸', color: 'hover:border-pink-500 hover:text-pink-400' },
  { value: 'SUMMER', label: 'ฤดูร้อน ☀️', color: 'hover:border-amber-500 hover:text-amber-400' },
  { value: 'FALL', label: 'ฤดูใบไม้ร่วง 🍂', color: 'hover:border-orange-500 hover:text-orange-400' },
];

const SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'ความนิยมสูงสุด (Popularity)' },
  { value: 'SCORE_DESC', label: 'คะแนนสูงสุด (Top Rated)' },
  { value: 'START_DATE_DESC', label: 'เข้าฉายล่าสุด (Newest)' },
  { value: 'TRENDING_DESC', label: 'กำลังเป็นกระแส (Trending)' },
];

export function SeasonalFilterSelector({
  currentSeason,
  currentYear,
  currentGenre,
  currentSort,
  genres,
}: SeasonalFilterSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // คำนวณช่วงปีสำหรับเลือกตัวกรอง (ย้อนหลัง 6 ปี - ล่วงหน้า 2 ปีจากปัจจุบัน)
  const currentSystemYear = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => currentSystemYear - 6 + i);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // อัปเดตค่าพารามิเตอร์แต่ละตัว
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // รีเซ็ตการค้นหาทั่วไปเมื่อปรับเปลี่ยนฟิลเตอร์โครงสร้างหลัก
    if (updates.season || updates.year || updates.genre) {
      params.delete('search');
    }

    router.push(`/seasonal?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Seasons Grid Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {SEASONS.map((season) => {
          const isActive = currentSeason === season.value;
          
          return (
            <button
              key={season.value}
              onClick={() => updateFilters({ season: season.value })}
              className={`py-3.5 px-4 rounded-2xl text-center border font-bold text-xs md:text-sm tracking-wider uppercase transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-violet-600 to-pink-600 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : `bg-slate-900/40 border-slate-800 text-slate-400 ${season.color}`
              }`}
            >
              {season.label}
            </button>
          );
        })}
      </div>

      {/* 2. Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Year Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <span>ปีที่ออกอากาศ (Year)</span>
          </label>
          <select
            value={currentYear}
            onChange={(e) => updateFilters({ year: e.target.value })}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-slate-200 focus:outline-none transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-slate-950 text-slate-200">
                ปี {y}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>แนวหมวดหมู่ (Genre)</span>
          </label>
          <select
            value={currentGenre || ''}
            onChange={(e) => updateFilters({ genre: e.target.value || null })}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-slate-200 focus:outline-none transition-colors"
          >
            <option value="" className="bg-slate-950 text-slate-400 font-bold">
              ทุกหมวดหมู่ (All Genres)
            </option>
            {genres.map((g) => (
              <option key={g} value={g} className="bg-slate-950 text-slate-200">
                แนว {g}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>การจัดเรียงลำดับ (Sort By)</span>
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-slate-200 focus:outline-none transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
}
