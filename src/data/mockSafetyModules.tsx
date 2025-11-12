import { Heart, Shield, AlertTriangle, Settings, Lock } from "lucide-react";

export interface SafetyModule {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  point?: number;
  videoUrl?: string;
  quiz?: { question: string; options: string[]; answer: string }[];
  qna?: { question: string; answer: string }[];
}

export const mockSafetyModules: SafetyModule[] = [
  {
    id: "1",
    title: "CPR Training",
    description: "Learn life-saving cardiopulmonary resuscitation techniques",
    category: "First Aid",
    icon: <Heart className="w-6 h-6 text-red-500" />,
    point: 3,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    quiz: [
      {
        question: "What is the first step in CPR?",
        options: [
          "Call 911",
          "Check pulse",
          "Give breaths",
          "Chest compressions",
        ],
        answer: "Check pulse",
      },
      {
        question: "How deep should chest compressions be?",
        options: ["1 inch", "2 inches", "3 inches", "4 inches"],
        answer: "2 inches",
      },
      {
        question: "What is the first step in CPR?",
        options: [
          "Call 911",
          "Check pulse",
          "Give breaths",
          "Chest compressions",
        ],
        answer: "Check pulse",
      },
      {
        question: "How deep should chest compressions be?",
        options: ["1 inch", "2 inches", "3 inches", "4 inches"],
        answer: "2 inches",
      },
      {
        question: "What is the first step in CPR?",
        options: [
          "Call 911",
          "Check pulse",
          "Give breaths",
          "Chest compressions",
        ],
        answer: "Check pulse",
      },
      {
        question: "How deep should chest compressions be?",
        options: ["1 inch", "2 inches", "3 inches", "4 inches"],
        answer: "2 inches",
      },
    ],
    qna: [
      { question: "Can anyone perform CPR?", answer: "Yes, after training." },
      {
        question: "How often should CPR be updated?",
        answer: "Every 2 years.",
      },
    ],
  },
  {
    id: "2",
    title: "First Aid Basics",
    description: "Essential first aid skills for emergency situations",
    category: "First Aid",
    icon: <Shield className="w-6 h-6 text-blue-500" />,
    point: 1,
    videoUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
    quiz: [
      {
        question: "What should you do for a minor cut?",
        options: [
          "Wash, disinfect, cover",
          "Ignore",
          "Apply ointment only",
          "Call 911",
        ],
        answer: "Wash, disinfect, cover",
      },
    ],
    qna: [
      { question: "Do you need gloves?", answer: "Yes, to avoid infection." },
    ],
  },
  {
    id: "3",
    title: "Earthquake Safety",
    description: "What to do before, during, and after an earthquake",
    category: "Emergency",
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
    point: 0,
    videoUrl: "https://www.youtube.com/embed/3JZ_D3ELwOQ",
    quiz: [],
    qna: [],
  },
];
