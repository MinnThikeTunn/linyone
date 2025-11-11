'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Globe,
  AlertTriangle,
  Heart,
  Shield,
  MapPin,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  category?: 'safety' | 'emergency' | 'location' | 'medical' | 'general'
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  prompt: string
  category: 'safety' | 'emergency' | 'location' | 'medical' | 'general'
}

const quickActions: QuickAction[] = [
  {
    id: '1',
    label: 'Earthquake Safety',
    icon: <AlertTriangle className="w-4 h-4" />,
    prompt: 'What should I do during an earthquake?',
    category: 'safety'
  },
  {
    id: '2',
    label: 'Find Shelter',
    icon: <MapPin className="w-4 h-4" />,
    prompt: 'Where is the nearest emergency shelter?',
    category: 'location'
  },
  {
    id: '3',
    label: 'First Aid',
    icon: <Heart className="w-4 h-4" />,
    prompt: 'How do I perform basic first aid?',
    category: 'medical'
  },
  {
    id: '4',
    label: 'Emergency Contacts',
    icon: <Phone className="w-4 h-4" />,
    prompt: 'What are the emergency phone numbers?',
    category: 'emergency'
  },
  {
    id: '5',
    label: 'Emergency Kit',
    icon: <Shield className="w-4 h-4" />,
    prompt: 'What should be in my emergency kit?',
    category: 'safety'
  }
]

const mockResponses: { [key: string]: string } = {
  'earthquake': 'During an earthquake: 1) Drop to hands and knees immediately, 2) Take cover under a sturdy desk or table, 3) Hold on until shaking stops. Stay away from windows, heavy objects, and exterior walls. If outdoors, move away from buildings, trees, and power lines.',
  'shelter': 'The nearest emergency shelters are typically located at schools, community centers, and government buildings. Check the map on our main page for real-time shelter locations near you. Shelters provide food, water, medical aid, and temporary accommodation.',
  'first aid': 'Basic first aid steps: 1) Check the scene for safety, 2) Check for consciousness and breathing, 3) Call emergency services if needed, 4) Control bleeding with direct pressure, 5) Keep the person warm and comfortable, 6) Monitor their condition until help arrives.',
  'emergency': 'Emergency numbers in Myanmar: Fire - 199, Police - 199, Ambulance - 199. For earthquake-specific emergencies, also contact the Disaster Management Department at 067-409-888. Save these numbers in your phone.',
  'kit': 'Emergency kit essentials: Water (1 gallon/person/day for 3 days), Non-perishable food (3-day supply), Flashlight and batteries, First aid kit, Medications, Whistle, Dust masks, Manual can opener, Local maps, Cell phone with chargers, Important documents, Cash, Emergency blanket.'
}

export default function AIChatAssistant() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: language === 'en' 
        ? 'Hello! I\'m your AI assistant for earthquake safety and emergency response. How can I help you today?'
        : 'မင်္ဂလာပါ! ကျွန်ုပ်သည် ငလျင်လုံခြုံရေးနှင့် အရေးပေါ်တုန်းဆိုင်းမှု AI လက်ထောက်ဖြစ်ပါသည်။ ကျွန်ုပ်ကို ဘယ်လိုကူညီနိုင်ပါသလဲ?',
      timestamp: new Date(),
      category: 'general'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Check for keywords and provide relevant responses
    if (lowerMessage.includes('earthquake') || lowerMessage.includes('ငလျင်')) {
      return mockResponses['earthquake']
    } else if (lowerMessage.includes('shelter') || lowerMessage.includes('ခိုလှုံရာ')) {
      return mockResponses['shelter']
    } else if (lowerMessage.includes('first aid') || lowerMessage.includes('ပထမအကူအညီ')) {
      return mockResponses['first aid']
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('phone') || lowerMessage.includes('အရေးပေါ်')) {
      return mockResponses['emergency']
    } else if (lowerMessage.includes('kit') || lowerMessage.includes('supplies') || lowerMessage.includes('အသုံးအဆောင်')) {
      return mockResponses['kit']
    } else {
      // Default response
      return language === 'en'
        ? 'I understand you need help with emergency preparedness. For specific assistance, you can ask about earthquake safety, finding shelters, first aid, emergency contacts, or emergency kits. If this is a real emergency, please call 199 immediately.'
        : 'အရေးပေါ်ပြင်ဆင်မှုအတွက် ကူညီမှုလိုအပ်ကြောင်း ကျွန်ုပ်နားလည်ပါသည်။ သီးခြားအကူအညီများအတွက် ငလျင်လုံခြုံရေး၊ ခိုလှုံရာရှာဖွေခြင်း၊ ပထမအကူအညီ၊ အရေးပေါ်ဆက်သွယ်ရန် ဖုန်းနံပါတ်များ သို့မဟုတ် အရေးပေါ်အသုံးအဆောင်ပစ္စည်းများအကြောင်း မေးနိုင်ပါသည်။ အကယ်၍ ဤသည် အရေးပေါ်အခြေအနေဖြစ်ပါက ချက်ချင်း 199 ကိုခေါ်ပါ။'
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(inputMessage),
        timestamp: new Date(),
        category: 'general'
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (action: QuickAction) => {
    setInputMessage(action.prompt)
    handleSendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true)
      // Simulate voice recognition
      setTimeout(() => {
        setInputMessage('What should I do during an earthquake?')
        setIsListening(false)
      }, 2000)
    } else {
      setIsListening(false)
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'safety': return 'bg-blue-100 text-blue-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      case 'location': return 'bg-green-100 text-green-800'
      case 'medical': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs opacity-90">
              {language === 'en' ? 'Earthquake Safety & Emergency' : 'ငလျင်လုံခြုံရေးနှင့် အရေးပေါ်'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700 p-1"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex gap-2 overflow-x-auto">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="flex items-center gap-1 whitespace-nowrap text-xs"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'assistant' && (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.category && message.type === 'assistant' && (
                        <Badge className={`text-xs ${getCategoryColor(message.category)}`}>
                          {message.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVoiceInput}
            className={`p-2 ${isListening ? 'bg-red-100 text-red-600' : ''}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              language === 'en'
                ? 'Ask about earthquake safety, shelters, first aid...'
                : 'ငလျင်လုံခြုံရေး၊ ခိုလှုံရာများ၊ ပထမအကူအညီအကြောင်း မေးပါ...'
            }
            className="flex-1"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {language === 'en'
            ? 'For real emergencies, call 199 immediately'
            : 'အရေးပေါ်အခြေအနေများအတွက် 199 ကို ချက်ချင်းခေါ်ပါ'}
        </div>
      </div>
    </div>
  )
}