import React from 'react';
import { translateGenreToThai, translateGenreToEnglish } from '@/lib/basePath';

interface GenreBadgeProps {
  genre: string;
}

/**
 * ป้ายกำกับประเภทอนิเมะพร้อมกำหนดสีนีออนจำเพาะสำหรับแนวเด่น ๆ
 * เพื่อให้ UI มีสีสันสวยงามและมีความน่าสนใจในระดับพรีเมียม
 */
export function GenreBadge({ genre }: GenreBadgeProps) {
  const getGenreStyles = (name: string): { bg: string; text: string; border: string } => {
    // แปลงเป็นภาษาอังกฤษเพื่อตรวจสอบประเภทและเลือกสไตล์สีที่ถูกต้อง
    const englishGenre = translateGenreToEnglish(name);
    const n = englishGenre.toLowerCase();
    
    if (n === 'action' || n === 'martial arts') {
      return {
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-500/30 hover:border-red-500/70',
      };
    }
    if (n === 'adventure' || n === 'fantasy') {
      return {
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-500/30 hover:border-amber-500/70',
      };
    }
    if (n === 'comedy' || n === 'slice of life') {
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30 hover:border-emerald-500/70',
      };
    }
    if (n === 'drama' || n === 'psychological') {
      return {
        bg: 'bg-pink-950/40',
        text: 'text-pink-400',
        border: 'border-pink-500/30 hover:border-pink-500/70',
      };
    }
    if (n === 'romance') {
      return {
        bg: 'bg-rose-950/40',
        text: 'text-rose-400',
        border: 'border-rose-500/30 hover:border-rose-500/70',
      };
    }
    if (n === 'sci-fi' || n === 'mecha') {
      return {
        bg: 'bg-cyan-950/40',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30 hover:border-cyan-500/70',
      };
    }
    if (n === 'mystery' || n === 'supernatural' || n === 'horror') {
      return {
        bg: 'bg-purple-950/40',
        text: 'text-purple-400',
        border: 'border-purple-500/30 hover:border-purple-500/70',
      };
    }
    // Default styles
    return {
      bg: 'bg-slate-800/40',
      text: 'text-slate-300',
      border: 'border-slate-700/50 hover:border-slate-500',
    };
  };

  const styles = getGenreStyles(genre);
  const displayGenre = translateGenreToThai(genre);

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 ${styles.bg} ${styles.text} ${styles.border}`}
    >
      {displayGenre}
    </span>
  );
}

