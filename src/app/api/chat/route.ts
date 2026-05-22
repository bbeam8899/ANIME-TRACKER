import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Missing API Key', 
          message: 'กรุณากำหนดค่า GEMINI_API_KEY ในไฟล์ .env.local หลังบ้านเพื่อใช้แชทบอท Gemini 2.5 Flash แบบเรียลไทม์' 
        },
        { status: 500 }
      );
    }

    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // เตรียมระบบคำสั่งสำหรับ Gemini (System Instruction)
    const customAnimeStr = context?.customAnime 
      ? JSON.stringify(context.customAnime.slice(0, 10)) 
      : 'ไม่มีข้อมูลอนิเมะแอดมินในขณะนี้';
      
    const trendingAnimeStr = context?.trendingAnime 
      ? JSON.stringify(context.trendingAnime.slice(0, 5)) 
      : 'ไม่มีข้อมูลอนิเมะยอดฮิตในขณะนี้';

    const systemInstruction = `คุณคือ Gemini AI (โมเดล Gemini 2.5 Flash) ที่ปรึกษาด้านอนิเมะส่วนตัวอัจฉริยะประจำเว็บไซต์ Anime Tracker ของผู้ใช้ชื่อคุณบีม (Beam)
ตอบคำถามผู้ใช้อย่างสุภาพ สุภาพเรียบร้อย เป็นกันเอง และมีหางเสียงลงท้ายด้วย "ครับ" ในภาษาไทยเสมอ 🎮🤖✨

นี่คือข้อมูลแวดล้อม (Context) ของหน้าเว็บ Anime Tracker ในปัจจุบัน:
- รายชื่ออนิเมะพิเศษจากหลังบ้านหลังการเพิ่มของแอดมิน (Custom Database): ${customAnimeStr}
- รายชื่ออนิเมะยอดฮิตประจำฤดูกาลปัจจุบันใน AniList: ${trendingAnimeStr}

คำแนะนำและกฎข้อบังคับการตอบกลับ:
1. หากผู้ใช้ขอคำแนะนำอนิเมะ ให้ค้นหาอนิเมะที่ตรงกับแนวเรื่องหรือความชอบของพวกเขาจากระบบฐานข้อมูลที่เราเตรียมไว้ให้ข้างต้นก่อน หากไม่มีเรื่องใดตรง สามารถแนะนำอนิเมะเด่นๆ นอกระบบจากฐานความรู้ของโมเดล Gemini 2.5 เพิ่มเติมได้อย่างอิสระ
2. แนะนำระบบของหน้าเว็บประกอบการตอบคำถามเสมอ เช่น:
   - ตารางฉายประจำวัน และค้นหาด่วนที่หน้า [แดชบอร์ดหลัก (Home Page)](/)
   - ระบบค้นหา คัดแยกประเภทตามซีซัน ยอดนิยม และประเภทแนวเรื่องที่หน้า [ตัวกรองซีซัน (Seasonal)](/seasonal)
   - แผงควบคุมและเพิ่มเรื่องอนิเมะได้เองแบบสดๆ ที่หน้า [จัดการหลังบ้านแอดมิน (Admin Panel)](/admin)
3. การเขียนลิ้งก์นำทางระบบในหน้าเว็บ ให้ใช้รูปแบบ Markdown ที่เป็น path จริงเสมอ (เช่น [หน้าแรก](/) หรือ [ตัวกรองซีซัน](/seasonal) หรือ [แอดมิน](/admin)) ห้ามใช้ URL เต็มที่เป็น http/https
4. ตอบคำถามอนิเมะอื่นๆ ที่พวกเขาอยากคุย ค้นหาข้อมูลผู้สร้าง ทีมพากย์ สตูดิโอ หรือแนะนำแนวเรื่องได้เต็มที่กระชับ และจัดรูปแบบข้อความด้วย Markdown (เช่น ตัวหนา **คำหลัก** หรือหัวข้อย่อยรายการ) ให้อ่านง่าย สวยงาม`;

    // แปลงแชทประวัติประวัติการสนทนาให้เข้ากับฟอร์แมต Gemini API (v1beta)
    // Gemini ใช้ฟอร์แมต: contents: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    const formattedContents = messages.map((msg: any) => {
      // ปรับบทบาท 'assistant' เป็น 'model' ตามมาตรฐาน Gemini API
      const role = msg.role === 'user' ? 'user' : 'model';
      return {
        role: role,
        parts: [{ text: msg.content }]
      };
    });

    // เรียก Gemini 2.5 Flash API ผ่าน Google Generative AI REST Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Response Error:', data);
      return NextResponse.json(
        { error: 'Gemini API Error', message: data.error?.message || 'การประมวลผลคำขอล้มเหลว' },
        { status: response.status }
      );
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return NextResponse.json(
        { error: 'No response content', message: 'โมเดล Gemini ไม่ได้ส่งข้อความตอบกลับในรูปแบบที่ถูกต้อง' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error('API Route Gemini Chat Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'เกิดข้อผิดพลาดในการประมวลผลเซิร์ฟเวอร์หลังบ้าน' },
      { status: 500 }
    );
  }
}
