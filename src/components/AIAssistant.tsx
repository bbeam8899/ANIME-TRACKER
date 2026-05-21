'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, RefreshCw, Trash2, ArrowLeftRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // คำถามด่วนที่เป็นปุ่มแนะนำ (Prompt Chips)
  const suggestionChips = [
    { text: 'แนะนำอนิเมะแนวแฟนตาซีเด็ดๆ', short: 'แนะนำแนวแฟนตาซี' },
    { text: 'วันนี้มีอนิเมะเรื่องอะไรออกฉายบ้าง?', short: 'ตารางฉายวันนี้' },
    { text: 'แนะนำอนิเมะดราม่าซึ้งๆ น้ำตาไหล', short: 'แนะนำอนิเมะดราม่าซึ้งๆ' },
    { text: 'แนะนำอนิเมะแนวไซไฟสุดล้ำให้หน่อย', short: 'แนะนำแนวไซไฟ' }
  ];

  // 1. ตั้งค่าการดักฟัง Event เปิดแชทจากปุ่มด้านบนขวา
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('toggle-ai-assistant', handleToggle);

    // สร้างข้อความต้อนรับเริ่มต้นจาก Gemma AI เมื่อเริ่มโหลดหน้าจอเป็นครั้งแรก
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'model',
          content: `**สวัสดีครับคุณผู้ดู! ยินดีต้อนรับสู่ Anime Tracker ครับ!** 🎮🤖\n\nกระผมคือ **Gemma AI** ที่ปรึกษาด้านอนิเมะส่วนตัวของคุณ คอยช่วยเหลือแนะนำอนิเมะตารางฉาย ค้นหาแนวเรื่องที่ตรงใจ หรือระบบงานต่าง ๆ ของเว็บไซต์อย่างสุภาพและรวดเร็ว\n\nวันนี้อยากให้ช่วยแนะนำอนิเมะแนวไหน หรือสอบถามตารางฉายของวันใดดีครับ? พิมพ์ถามมาได้เลยนะครับ! ✨`,
          timestamp: new Date()
        }
      ]);
    }

    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggle);
    };
  }, [messages.length]);

  // 2. ปรับให้แถบเลื่อนแชทไหลลงไปด้านล่างสุดโดยอัตโนมัติเมื่อมีข้อความใหม่เข้ามา
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, isOpen, isLoading]);

  // 3. จัดการฟังก์ชันล้างประวัติการแชท
  const handleClearHistory = () => {
    if (confirm('คุณต้องการลบประวัติการสนทนาทั้งหมดกับ Gemma AI ใช่หรือไม่?')) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'model',
          content: `ประวัติการแชทถูกล้างข้อมูลแล้วครับ! 🧹🤖\n\nกระผม **Gemma AI** พร้อมให้บริการเริ่มต้นคำปรึกษาใหม่แล้วครับ มีอนิเมะเรื่องไหนที่คุณผู้ดูอยากคุยด้วยเป็นพิเศษไหมครับ?`,
          timestamp: new Date()
        }
      ]);
      setError('');
    }
  };

  // 4. ส่งข้อความไปยัง API Route
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError('');
    const userMsgText = textToSend;
    setInput('');

    // เพิ่มข้อความของผู้ใช้ลงในประวัติ
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // เตรียม History ส่งไปให้ API (ฟอร์แมตข้อมูลตาม API)
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsgText,
          history: chatHistory
        }),
      });

      const data = await res.json();

      if (res.ok && data.content) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'model',
          content: data.content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก AI');
      }

    } catch (err: any) {
      console.error('Chat AI Error:', err);
      setError(err.message || 'การเชื่อมต่อขัดข้อง กรุณาลองใหม่อีกครั้ง');
      
      // เพิ่มข้อความระบบแจ้งเตือนข้อผิดพลาด
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `⚠️ **ระบบเชื่อมต่อขัดข้องชั่วคราวครับคุณผู้ดู:** \nไม่สามารถขอข้อมูลจาก Gemma AI Engine ได้ในขณะนี้ กรุณาลองส่งคำถามใหม่อีกครั้ง หรือเช็คการตั้งค่า API ในเบื้องหลังของระบบครับ`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันจัดรูปแบบข้อความ Markdown แบบง่าย
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let formatted = line;

      // จัดการตัวหนา: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, '<strong class="font-extrabold text-violet-300">$1</strong>');

      // จัดการตัวเอียงหรือป้ายคำหลัก: *text*
      const italicRegex = /\*(.*?)\*/g;
      formatted = formatted.replace(italicRegex, '<em class="text-pink-400 not-italic font-bold bg-pink-950/20 px-1 py-0.5 rounded border border-pink-500/10">$1</em>');

      // จัดการหัวข้อย่อย: - หรือ *
      if (formatted.startsWith('- ') || formatted.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-355 text-xs md:text-sm leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }

      // จัดการ Blockquote
      if (formatted.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-violet-500 bg-violet-950/15 pl-3 py-1 my-1.5 rounded-r text-xs text-slate-400 italic" 
              dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }

      // ตรวจหาลิงก์แบบ Markdown [text](url)
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      formatted = formatted.replace(linkRegex, '<a href="$2" class="text-cyan-400 hover:text-cyan-300 font-extrabold underline transition-colors">$1</a>');

      return (
        <p key={idx} className="text-xs md:text-sm leading-relaxed min-h-[1rem]" 
           dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <>
      {/* 1. Backdrop Overlay (ฉากหลังมืดกระจกเบลอเมื่อเปิดแถบแชท) */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-50 bg-black/55 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Main Chat Panel (แผงแชทสไลด์โอเวอร์สุดล้ำ) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md sm:max-w-lg z-50 bg-[#070a12]/98 border-l border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        {/* ส่วนหัวแผงแชท (Gemma Assistant Header) */}
        <div className="p-4 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 p-[2px] shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5.5 h-5.5 text-violet-400" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#070a12] animate-pulse" />
            </div>
            
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-white">Gemma AI</h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-violet-950/60 border border-violet-500/25 px-1.5 py-0.5 rounded text-violet-400">Gemma 4 Engine</span>
              </div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">ที่ปรึกษาอนิเมะส่วนตัวสากล</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* ปุ่มล้างประวัติ */}
            <button
              onClick={handleClearHistory}
              className="p-2 hover:bg-slate-900 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
              title="ล้างประวัติการสนทนา"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {/* ปุ่มปิด */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ส่วนเนื้อหาข้อความการแชท (Chat Messages Container) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.role === 'model';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${
                  isAI ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
                }`}
              >
                {/* อวาตาร์ข้างข้อความ (เฉพาะ AI) */}
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-violet-400 self-end">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* กล่องฟองคำพูดแชท */}
                <div className="flex flex-col space-y-1">
                  <div 
                    className={`p-3.5 rounded-2xl shadow-lg border relative group text-slate-200 ${
                      isAI 
                        ? 'bg-slate-950/90 border-slate-900 rounded-bl-xs' 
                        : 'bg-gradient-to-tr from-violet-600 to-pink-600 border-violet-500/25 rounded-br-xs text-white'
                    }`}
                  >
                    <div className="space-y-1.5 select-text selection:bg-slate-800">
                      {formatMarkdown(msg.content)}
                    </div>
                  </div>
                  {/* เวลาที่ส่ง */}
                  <span className={`text-[9px] text-slate-500 font-bold font-mono ${!isAI ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* อนิเมชั่นพิมพ์ของ AI (AI Typing Indicator) */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] self-start mr-auto items-end">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex flex-col space-y-1">
                <div className="bg-slate-950/80 border border-slate-900 p-3 rounded-2xl rounded-bl-xs flex items-center space-x-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[9px] text-slate-550 font-bold font-mono">Gemma กำลังใช้สมองครุ่นคิด...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ส่วนด้านล่างสุด: แผงชิปคำถามแนะนำ และ อินพุตสำหรับส่งข้อความ */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/30 space-y-3.5">
          
          {/* ชิปข้อแนะนำคำถามด่วน (Prompt Chips) - แสดงเฉพาะเมื่อ AI พร้อมตอบ */}
          {!isLoading && messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="text-[10px] md:text-xs font-semibold px-2.5 py-1.5 bg-[#0a0f1d] hover:bg-violet-950/30 border border-slate-850 hover:border-violet-500/20 text-slate-350 hover:text-violet-400 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-violet-500" />
                  <span>{chip.short}</span>
                </button>
              ))}
            </div>
          )}

          {/* กล่องอินพุตสำหรับพิมพ์แชท */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }} 
            className="flex items-center space-x-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ถาม Gemma AI (เช่น แนะนำอนิเมะโรแมนติก)..."
                disabled={isLoading}
                className="w-full bg-[#03060c] border border-slate-850 hover:border-slate-800 focus:border-violet-500 focus:outline-none rounded-2xl py-3.5 pl-4 pr-10 text-xs sm:text-sm text-slate-100 placeholder-slate-550 shadow-inner transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:from-slate-900 disabled:to-slate-900 text-white rounded-2xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.15)] disabled:shadow-none hover:shadow-[0_8px_18px_rgba(139,92,246,0.25)] disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* คำบรรยายแบรนด์ปิดท้าย */}
          <div className="flex items-center justify-center space-x-1.5 opacity-60 text-slate-500">
            <span className="text-[9px] font-black uppercase tracking-wider">SECURE AI CONSULTING PORT • POWERED BY GEMMA 4</span>
          </div>
        </div>

      </div>
    </>
  );
}
