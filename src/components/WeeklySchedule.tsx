'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Star, Tv, ChevronRight, RefreshCw, Radio } from 'lucide-react';
import { AiringScheduleItem } from '@/lib/types';

interface WeeklyScheduleProps {
  scheduleItems: AiringScheduleItem[];
}

const DAYS_OF_WEEK = [
  { name: 'จันทร์', english: 'Monday', index: 1 },
  { name: 'อังคาร', english: 'Tuesday', index: 2 },
  { name: 'พุธ', english: 'Wednesday', index: 3 },
  { name: 'พฤหัสฯ', english: 'Thursday', index: 4 },
  { name: 'ศุกร์', english: 'Friday', index: 5 },
  { name: 'เสาร์', english: 'Saturday', index: 6 },
  { name: 'อาทิตย์', english: 'Sunday', index: 0 },
];

export function WeeklySchedule({ scheduleItems }: WeeklyScheduleProps) {
  // เริ่มต้นด้วยวันจันทร์ (1) เป็นค่าเริ่มต้นทั้งฝั่ง Server และ Client ในการเรนเดอร์ครั้งแรกเพื่อหลีกเลี่ยง Hydration mismatch
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // เก็บรายการใน State เพื่อรองรับ Client-side Real-time updates
  const [items, setItems] = useState<AiringScheduleItem[]>(scheduleItems);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // ปรับเป็นวันปัจจุบันหลังจากการ Mount บนฝั่ง Client เสร็จสิ้น
  useEffect(() => {
    setIsMounted(true);
    const today = new Date().getDay();
    setActiveDay(today);
    setLastUpdateTime(new Date());
  }, []);

  // ฟังก์ชันดึงตารางฉายล่าสุดแบบสด ๆ จาก Next.js API
  const fetchLiveSchedule = async (showLoadingState = false) => {
    if (isRefreshing) return;
    if (showLoadingState) {
      setIsRefreshing(true);
    }

    try {
      const now = new Date();
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const start = Math.floor(monday.getTime() / 1000);
      const end = Math.floor(sunday.getTime() / 1000);

      const response = await fetch(`/api/schedule?start=${start}&end=${end}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('API schedule response was not ok');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setItems(data);
        setLastUpdateTime(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch live schedule:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ดึงข้อมูลใหม่แบบอัตโนมัติ (Live Polling) ทุก ๆ 60 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLiveSchedule(false);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    fetchLiveSchedule(true);
  };

  // การจัดกลุ่มรายการตามวันในสัปดาห์ (Local Time)
  const groupedSchedule = useMemo(() => {
    const groups: Record<number, AiringScheduleItem[]> = {
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
      0: [], // Sunday
    };

    items.forEach((item) => {
      const date = new Date(item.airingAt * 1000);
      const day = date.getDay(); // 0-6
      if (groups[day] !== undefined) {
        groups[day].push(item);
      }
    });

    // เรียงลำดับตามเวลาออกอากาศในแต่ละวัน
    Object.keys(groups).forEach((key) => {
      const k = Number(key);
      groups[k].sort((a, b) => a.airingAt - b.airingAt);
    });

    return groups;
  }, [items]);

  const activeItems = groupedSchedule[activeDay] || [];

  return (
    <div className="space-y-6">
      
      {/* 🟢 Live Polling & Auto Sync Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/40 p-4 rounded-2xl border border-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {/* Live auto-refresh toggler */}
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-slate-300 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>REAL-TIME AUTO UPDATE</span>
          </span>
          <span className="text-[10px] text-slate-500 font-bold border-l border-slate-800 pl-2">
            ตารางเวลาอัปเดตอัตโนมัติ (สดทุก 60 วินาที)
          </span>
        </div>
        
        {/* Sync time / manually update button */}
        <div className="flex items-center space-x-3 text-slate-400 font-bold">
          {lastUpdateTime && (
            <span>อัปเดตล่าสุด: {lastUpdateTime.toLocaleTimeString('th-TH')} น.</span>
          )}
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="hover:text-violet-400 active:scale-95 transition-all bg-slate-900 border border-slate-850 hover:border-slate-700 py-1.5 px-3 rounded-xl flex items-center space-x-1.5 disabled:opacity-50 font-black cursor-pointer shadow-sm hover:shadow-violet-500/10"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-violet-400' : ''}`} />
            <span>ดึงสดใหม่</span>
          </button>
        </div>
      </div>
      
      {/* Weekday Tab Switcher */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 scrollbar-thin scrollbar-thumb-slate-800">
        {DAYS_OF_WEEK.map((day) => {
          const isActive = activeDay === day.index;
          const count = groupedSchedule[day.index]?.length || 0;
          
          return (
            <button
              key={day.index}
              onClick={() => setActiveDay(day.index)}
              className={`flex-1 min-w-[90px] md:min-w-0 py-3.5 px-3 rounded-2xl text-center border font-bold transition-all duration-300 relative flex flex-col justify-center items-center gap-1 ${
                isActive
                  ? 'bg-gradient-to-br from-violet-600/30 to-pink-600/30 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
              )}
              <span className="text-xs uppercase tracking-wider opacity-70 font-semibold">{day.english.slice(0, 3)}</span>
              <span className="text-sm md:text-base font-bold">{day.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                isActive ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Airing Anime List */}
      <div className="space-y-3.5 min-h-[300px]">
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeItems.map((item) => {
              const displayTitle = item.media.title.english || item.media.title.romaji || item.media.title.native || 'Unknown Title';
              const mainStudio = item.media.studios?.nodes?.[0]?.name;
              const score = item.media.averageScore ? (item.media.averageScore / 10).toFixed(1) : null;
              
              // ฟอร์แมตเวลาออกอากาศ
              const airTime = new Date(item.airingAt * 1000).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Link
                  href={`/anime/${item.media.id}`}
                  key={item.id}
                  className="group block"
                >
                  <div className="glass-panel glass-panel-hover p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0">
                      
                      {/* Thumbnail Cover */}
                      <div className="relative w-14 h-20 md:w-16 md:h-24 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                        {item.media.coverImage.large || item.media.coverImage.medium ? (
                          <img
                            src={item.media.coverImage.large || item.media.coverImage.medium}
                            alt={displayTitle}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-500">
                            No Cover
                          </div>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="space-y-1.5 min-w-0">
                        {/* Time of airing */}
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-violet-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{airTime} น.</span>
                          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            ตอนที่ {item.episode}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-sm md:text-base text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {displayTitle}
                        </h4>

                        {/* Metadata */}
                        <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
                          {mainStudio && (
                            <span className="text-cyan-400 truncate max-w-[140px]">
                              {mainStudio}
                            </span>
                          )}
                          {score && (
                            <div className="flex items-center space-x-0.5 text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{score}</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="bg-slate-900 p-2 rounded-xl group-hover:bg-violet-600 transition-colors duration-300 flex-shrink-0 ml-2">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-3.5">
            <span className="text-4xl">🎮</span>
            <h4 className="font-extrabold text-slate-200">ไม่มีอนิเมะฉายในวันนี้</h4>
            <p className="text-slate-400 text-sm max-w-sm">
              วันนี้ไม่มีรายการออกอากาศสดของอนิเมะในระบบ ถือเป็นโอกาสที่ดีในการไล่ดูตอนย้อนหลังหรือพักผ่อนเล่นเกมกันครับ!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
