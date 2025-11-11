import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'en' } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create context-aware prompt based on language
    const systemPrompt = language === 'my' 
      ? `You are an AI assistant for Lin Yone Tech earthquake response platform. You MUST respond ONLY in Myanmar (Burmese) language using proper Burmese script (မြန်မားများအက္ချောင်း).

        IMPORTANT LANGUAGE INSTRUCTIONS:
        - ALWAYS respond in Burmese script (မြန်မားများအက္ချောင်း)
        - Use proper Burmese grammar and vocabulary
        - Do NOT use romanized Burmese - use actual Burmese characters
        - Provide helpful information about:
          * Earthquake safety procedures (ငလျင်လုံခြုံရေးလမ်းနည်းချက်ချင်းမှု)
          * Emergency shelters and locations (အရေးပေါ်ခိုလှုံရာများနှင့် တည်နေရားများ)
          * First aid and medical help (ပထမအကူအညီနှင့် ဆေးရည်းအကူအညီ)
          * Emergency contacts and procedures (အရေးပေါ်ဆက်သွယ်ရန်ဖုန်းနံပါတ်များနှင့် လုပ်ငန်းချက်ချင်းမှု)
          * Emergency kit preparation (အရေးပေါ်အသုံးအဆောင်ပစ္စည်းပြင်ဆင်ခြင်း)
        
        CRITICAL: Always respond in Burmese script (မြန်မားများအက္ချောင်း). Never use English or romanized Burmese.
        Be concise, helpful, and prioritize safety.
        If this is a real emergency, always mention calling 199 immediately.
        Provide specific, actionable advice for earthquake scenarios.
        
        Example Burmese responses:
        - "ငလျင်လုံခြုံရေးလမ်းနည်းချက်ချင်းမှု" (for earthquake safety)
        - "အရေးပေါ်ခိုလှုံရာများနှင့် တည်နေရားများ" (for emergency shelters)
        - "သင့်သတ်ထားအိတ်ဆောင်ပစဉ်းအတွက် ရေးချိန်းလမ်းနိုင်ပါရှိပါသည်။" (for first aid)`
      : `You are an AI assistant for Lin Yone Tech earthquake response platform. 
        You provide helpful information about:
        - Earthquake safety procedures and what to do during/after earthquakes
        - Emergency shelters and safe locations 
        - First aid and medical help
        - Emergency contacts and procedures
        - Emergency kit preparation and supplies
        
        Always respond in English. Be concise, helpful, and prioritize safety.
        If this is a real emergency, always mention calling 199 immediately.
        Provide specific, actionable advice for earthquake scenarios.`

    // Create completion with ZAI
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Determine response category based on content
    let category = 'general'
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('earthquake') || lowerMessage.includes('ငလျင်') || 
        lowerMessage.includes('shake') || lowerMessage.includes('tremor')) {
      category = 'safety'
    } else if (lowerMessage.includes('shelter') || lowerMessage.includes('ခိုလှုံရာ') || 
               lowerMessage.includes('location') || lowerMessage.includes('where')) {
      category = 'location'
    } else if (lowerMessage.includes('first aid') || lowerMessage.includes('medical') || 
               lowerMessage.includes('injury') || lowerMessage.includes('ပထမအကူအညီ') ||
               lowerMessage.includes('ဆေးရည်းအကူအညီ')) {
      category = 'medical'
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || 
               lowerMessage.includes('danger') || lowerMessage.includes('အရေးပေါ်') ||
               lowerMessage.includes('urgent') || lowerMessage.includes('call')) {
      category = 'emergency'
    }

    return NextResponse.json({
      response: aiResponse,
      category,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    
    // Fallback response for debugging
    const fallbackResponse = language === 'my'
      ? 'တောင်းပြီးတောင်းအခက်အေးပါသည်။ အကယ်၍ ဆက်သွင်းပြန်လည်းမှုခြင်းမို့မဟုတ်ပါသည်။ အကယ်၍ ဤသည် အရေးပေါ်အခြေအနေဖြစ်ပါက ချက်ချင်း 199 ကို ခေါ်ပါ။'
      : 'I apologize, but I encountered an error. Please try again. If this is a real emergency, please call 199 immediately.'

    return NextResponse.json({
      response: fallbackResponse,
      category: 'general',
      timestamp: new Date().toISOString(),
      error: true
    }, { status: 500 })
  }
}