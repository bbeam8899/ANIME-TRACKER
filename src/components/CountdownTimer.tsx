'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { NextAiringEpisode } from '@/lib/types';

interface CountdownTimerProps {
  nextAiring: NextAiringEpisode;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ nextAiring }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isAired, setIsAired] = useState(false);

  useEffect(() => {
    // แปลงวินาทีของ AniList เป็นมิลลิวินาที
    const targetTime = nextAiring.airingAt * 1000;

    const calculateTimeLeft = () => {
      const difference = targetTime - Date.now();
      
      if (difference <= 0) {
        setIsAired(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [nextAiring.airingAt]);

  if (isAired) {
    return (
      <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl font-semibold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <Clock className="w-5 h-5 animate-pulse" />
        <span>ตอนล่าสุด (ตอนที่ {nextAiring.episode}) ฉายแล้วในขณะนี้!</span>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2.5 rounded-xl">
        <Clock className="w-5 h-5 animate-spin" />
        <span>กำลังคำนวณเวลานับถอยหลัง...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 md:p-5 rounded-2xl border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)] max-w-lg">
      <div className="flex items-center space-x-2 text-violet-400 font-bold mb-3 text-xs md:text-sm uppercase tracking-widest">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
        </span>
        <Clock className="w-4 h-4 text-violet-400" />
        <span>ตอนที่ {nextAiring.episode} จะฉายในอีก</span>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-3 text-center">
        {/* Days */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 min-w-[60px] md:min-w-[80px]">
          <div className="text-xl md:text-3xl font-extrabold text-slate-100 font-mono tracking-tight glow-text neon-glow-purple">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">วัน</div>
        </div>

        {/* Hours */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 min-w-[60px] md:min-w-[80px]">
          <div className="text-xl md:text-3xl font-extrabold text-slate-100 font-mono tracking-tight glow-text">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">ชม.</div>
        </div>

        {/* Minutes */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 min-w-[60px] md:min-w-[80px]">
          <div className="text-xl md:text-3xl font-extrabold text-slate-100 font-mono tracking-tight glow-text">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">นาที</div>
        </div>

        {/* Seconds */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 min-w-[60px] md:min-w-[80px] border-violet-500/20">
          <div className="text-xl md:text-3xl font-extrabold text-pink-500 font-mono tracking-tight animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs text-pink-400 font-semibold uppercase tracking-wider mt-1">วินาที</div>
        </div>
      </div>
    </div>
  );
}
