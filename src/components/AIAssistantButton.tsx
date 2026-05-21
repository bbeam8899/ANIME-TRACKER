'use client';

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export function AIAssistantButton() {
  const handleToggle = () => {
    // ส่ง Custom Event สากลเพื่อเรียกเปิดแถบสไลด์แชท AI ในระดับ Root Layout
    window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
  };

  return (
    <button
      onClick={handleToggle}
      className="relative p-2.5 bg-gradient-to-tr from-violet-950/50 to-pink-950/40 hover:from-violet-900/60 hover:to-pink-900/60 border border-violet-500/25 hover:border-violet-400/50 text-violet-300 hover:text-white rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_22px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 group flex items-center justify-center space-x-1.5"
      title="เปิดที่ปรึกษา Gemma AI"
      id="ai-assistant-header-button"
    >
      <div className="relative">
        <Bot className="w-5 h-5 group-hover:animate-pulse transition-transform duration-300 group-hover:rotate-6 text-violet-400 group-hover:text-pink-400" />
        {/* สัญญาณไฟกะพริบกระเพื่อมแบบเรียลไทม์ */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
        </span>
      </div>
      
      <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-slate-200 group-hover:text-white transition-colors">
        Gemma AI
      </span>
      
      <Sparkles className="w-3 h-3 text-pink-400 animate-pulse hidden xs:inline" />
    </button>
  );
}
