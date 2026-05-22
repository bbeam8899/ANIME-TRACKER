'use client';

import React, { useEffect } from 'react';
import { X, User, Calendar, Heart, Award, Sparkles } from 'lucide-react';
import { CharacterNode } from '@/lib/types';

interface CharacterModalProps {
  character: CharacterNode | null;
  isOpen: boolean;
  onClose: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function CharacterModal({ character, isOpen, onClose }: CharacterModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !character) return null;

  // Formatting helpers
  const getGenderText = (gender?: string) => {
    if (!gender) return 'ไม่ระบุ';
    const g = gender.toLowerCase().trim();
    if (g === 'male') return 'ชาย';
    if (g === 'female') return 'หญิง';
    return gender;
  };

  const getBirthdateText = (dob?: { year?: number; month?: number; day?: number }) => {
    if (!dob || (!dob.day && !dob.month)) return 'ไม่ระบุ';
    
    let text = '';
    if (dob.day && dob.month) {
      text += `${dob.day} ${THAI_MONTHS[dob.month - 1]}`;
    }
    if (dob.year) {
      text += ` (ค.ศ. ${dob.year})`;
    }
    return text;
  };

  const formatDescription = (desc?: string) => {
    if (!desc) return '<p class="text-gray-400 italic">ไม่มีข้อมูลประวัติตัวละครนี้ในขณะนี้</p>';

    // 1. Process Spoilers: ~!text!~ -> interactive spoiler span
    let formatted = desc.replace(/~!([\s\S]*?)!~/g, (_, spoilerText) => {
      return `<span class="bg-violet-950/80 text-violet-950/80 hover:text-white hover:bg-violet-900 border border-violet-800/30 cursor-pointer rounded px-1.5 py-0.5 select-none transition-all duration-300 inline-block font-medium text-sm my-0.5 blur-[2.5px] hover:blur-none" title="ผ่านเมาส์เพื่อแสดงสปอยล์">${spoilerText}</span>`;
    });

    // 2. Process bold tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 3. Process italic tags
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

    // 4. Process newlines
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-4 text-gray-300 leading-relaxed font-light">');
    formatted = formatted.replace(/\n/g, '<br />');

    // Wrap in standard paragraph if not already started
    return `<p class="mb-4 text-gray-300 leading-relaxed font-light">${formatted}</p>`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Modal Card wrapper */}
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col md:flex-row bg-slate-900/95 border border-violet-500/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] rounded-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-violet-600 border border-white/10 hover:border-violet-500 text-gray-300 hover:text-white rounded-full transition-all duration-300 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Large Portrait Cover (Art) */}
        <div className="relative w-full md:w-[350px] h-[300px] md:h-auto flex-shrink-0 bg-slate-950 border-b md:border-b-0 md:border-r border-white/10">
          {character.image?.large ? (
            <img 
              src={character.image.large} 
              alt={character.name.userPreferred} 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-gray-500">
              <User className="w-16 h-16 opacity-30 mb-2" />
              <span className="text-sm font-light">ไม่มีรูปภาพ</span>
            </div>
          )}
          
          {/* Overlay to blend image bottom on mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:hidden" />
        </div>

        {/* Right Side: Biographic Content & Stats */}
        <div className="flex-1 flex flex-col p-6 md:p-8 overflow-hidden">
          {/* Character Name */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              ประวัติเจาะลึก
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              {character.name.userPreferred}
            </h2>
          </div>

          {/* Quick Info Grid - Glassmorphism Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              <User className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-medium">เพศ</div>
                <div className="text-sm font-semibold text-white">{getGenderText(character.gender)}</div>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              <Award className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-medium font-bold">อายุ</div>
                <div className="text-sm font-semibold text-white">{character.age || 'ไม่ระบุ'}</div>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-medium">วันเกิด</div>
                <div className="text-sm font-semibold text-white truncate max-w-[120px]">{getBirthdateText(character.dateOfBirth)}</div>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-medium">กรุ๊ปเลือด</div>
                <div className="text-sm font-semibold text-white">{character.bloodType || 'ไม่ระบุ'}</div>
              </div>
            </div>
          </div>

          {/* Biography scroll panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
              <span>ชีวประวัติและข้อมูลเชิงลึก</span>
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div 
                className="prose prose-invert max-w-none text-gray-300 font-light leading-relaxed selection:bg-violet-500/30"
                dangerouslySetInnerHTML={{ __html: formatDescription(character.description) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
