'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

/**
 * ปุ่มย้อนกลับอัจฉริยะ (Smart Back Button)
 * ช่วยให้ผู้ใช้งานสามารถย้อนกลับไปยังหน้าจอก่อนหน้านี้ (เช่น หน้าตัวกรองซีซันพร้อมการฟิลเตอร์เดิม)
 * หรือเลือกกลับไปที่หน้าหลักบอร์ดได้อย่างรวดเร็วและลื่นไหลด้วยสไตล์พรีเมียม
 */
export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    // ย้อนกลับโดยใช้ history ของเบราว์เซอร์เพื่อคงค่าฟิลเตอร์หรือผลการค้นหาก่อนหน้า
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-2.5 justify-center md:justify-start w-full">
      {/* ⬅️ ปุ่มย้อนกลับหน้าก่อนหน้า (Dynamic Back Button) */}
      <button
        onClick={handleBack}
        className="inline-flex items-center space-x-2.5 text-xs font-black text-slate-200 hover:text-white transition-all bg-slate-900 hover:bg-violet-600/90 border border-slate-800 hover:border-violet-500 px-4.5 py-3 rounded-2xl cursor-pointer shadow-lg hover:shadow-violet-600/20 active:scale-95 group"
      >
        <ArrowLeft className="w-4 h-4 text-violet-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform duration-300" />
        <span>ย้อนกลับหน้าเดิม</span>
      </button>

      {/* 🏠 ปุ่มตรงกลับหน้าหลัก (Home Button) */}
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all bg-slate-950/40 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 px-4.5 py-3 rounded-2xl cursor-pointer active:scale-95 group"
      >
        <Home className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-350 transition-colors" />
        <span>ไปหน้าแรก</span>
      </button>
    </div>
  );
}
