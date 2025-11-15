'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Heart, 
  Shield, 
  AlertTriangle, 
  Settings, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Clock,
  Award,
  Trophy
} from 'lucide-react'
import Image from 'next/image'

interface LessonStep {
  id: number
  title: string
  content: string
  image?: string
  imageAlt?: string
}

interface Lesson {
  id: string
  title: string
  description: string
  category: string
  duration: string
  icon: React.ReactNode
  steps: LessonStep[]
}

const lessons: Record<string, Lesson> = {
  '1': {
    id: '1',
    title: 'CPR Training',
    description: 'Learn life-saving cardiopulmonary resuscitation techniques',
    category: 'First Aid',
    duration: '15 min',
    icon: <Heart className="w-6 h-6 text-red-500" />,
    steps: [
      {
        id: 1,
        title: 'Check for Responsiveness',
        content: 'First, check if the person is responsive. Tap their shoulder and shout "Are you okay?" If there is no response, call for emergency help immediately.',
        image: '/images/cpr-check.png',
        imageAlt: 'Checking for responsiveness'
      },
      {
        id: 2,
        title: 'Open the Airway',
        content: 'Place the person on their back on a firm surface. Tilt their head back slightly and lift the chin to open the airway. This helps ensure air can flow freely.',
        image: '/images/cpr-airway.png',
        imageAlt: 'Opening the airway'
      },
      {
        id: 3,
        title: 'Check for Breathing',
        content: 'Look, listen, and feel for breathing for no more than 10 seconds. Watch for chest movement, listen for breath sounds, and feel for air on your cheek.',
        image: '/images/cpr-breathing.png',
        imageAlt: 'Checking for breathing'
      },
      {
        id: 4,
        title: 'Start Chest Compressions',
        content: 'Place the heel of one hand on the center of the chest, place the other hand on top, and interlock fingers. Push hard and fast at a rate of 100-120 compressions per minute, about 2 inches deep.',
        image: '/images/cpr-compression.png',
        imageAlt: 'Chest compressions'
      },
      {
        id: 5,
        title: 'Give Rescue Breaths',
        content: 'After 30 compressions, give 2 rescue breaths. Pinch the nose closed, make a seal over the mouth, and blow until you see the chest rise. Each breath should take about 1 second.',
        image: '/images/cpr-breaths.png',
        imageAlt: 'Rescue breaths'
      },
      {
        id: 6,
        title: 'Continue CPR',
        content: 'Continue cycles of 30 compressions and 2 breaths until help arrives, an AED is available, or the person shows signs of life. Remember to maintain the correct rhythm and depth.',
        image: '/images/cpr-continue.png',
        imageAlt: 'Continuing CPR'
      }
    ]
  },
  '2': {
    id: '2',
    title: 'First Aid Basics',
    description: 'Essential first aid skills for emergency situations',
    category: 'First Aid',
    duration: '20 min',
    icon: <Shield className="w-6 h-6 text-blue-500" />,
    steps: [
      {
        id: 1,
        title: 'Assess the Situation',
        content: 'Before providing first aid, ensure the scene is safe for you and the victim. Look for potential hazards like fire, traffic, or unstable structures. Only proceed if it is safe to do so.',
        image: '/images/firstaid-assess.jpg',
        imageAlt: 'Assessing the situation'
      },
      {
        id: 2,
        title: 'Call for Help',
        content: 'If the situation is serious, call emergency services immediately. Provide clear information about the location, number of victims, and nature of injuries.',
        image: '/images/firstaid-call.jpg',
        imageAlt: 'Calling for help'
      },
      {
        id: 3,
        title: 'Control Bleeding',
        content: 'For bleeding wounds, apply direct pressure with a clean cloth or bandage. Elevate the injured area above the heart if possible. Continue pressure until bleeding stops or help arrives.',
        image: '/images/firstaid-bleeding.jpg',
        imageAlt: 'Controlling bleeding'
      },
      {
        id: 4,
        title: 'Treat for Shock',
        content: 'Keep the person calm and still. Lay them down and elevate their legs about 12 inches. Cover them with a blanket to maintain body temperature. Do not give them anything to eat or drink.',
        image: '/images/firstaid-shock.jpg',
        imageAlt: 'Treating for shock'
      },
      {
        id: 5,
        title: 'Bandage Wounds',
        content: 'Clean the wound with clean water if available. Apply a sterile bandage or clean cloth. Secure it firmly but not too tight. Change the bandage if it becomes wet or dirty.',
        image: '/images/firstaid-bandage.jpg',
        imageAlt: 'Bandaging wounds'
      }
    ]
  },
  '3': {
    id: '3',
    title: 'Earthquake Safety',
    description: 'What to do before, during, and after an earthquake',
    category: 'Emergency',
    duration: '10 min',
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
    steps: [
      {
        id: 1,
        title: 'Before an Earthquake',
        content: 'Prepare an emergency kit with water, food, flashlight, first aid supplies, and important documents. Secure heavy furniture and objects to walls. Know safe spots in each room.',
        image: '/images/earthquake-prepare.jpg',
        imageAlt: 'Preparing for earthquake'
      },
      {
        id: 2,
        title: 'During an Earthquake - Drop',
        content: 'Drop down to your hands and knees immediately. This position protects you from falling but allows you to move if necessary. Stay low to the ground.',
        image: '/images/earthquake-drop.jpg',
        imageAlt: 'Drop position during earthquake'
      },
      {
        id: 3,
        title: 'During an Earthquake - Cover',
        content: 'Cover your head and neck with your arms. If possible, get under a sturdy table or desk. Hold on to the furniture leg so it moves with you. If no shelter is available, crawl next to an interior wall.',
        image: '/images/earthquake-cover.jpg',
        imageAlt: 'Covering during earthquake'
      },
      {
        id: 4,
        title: 'During an Earthquake - Hold On',
        content: 'Hold on to your shelter until the shaking stops. Be prepared to move with your shelter if it shifts. Stay in place until you are sure the shaking has completely stopped.',
        image: '/images/earthquake-hold.jpg',
        imageAlt: 'Holding on during earthquake'
      },
      {
        id: 5,
        title: 'After an Earthquake',
        content: 'Check yourself and others for injuries. Be aware of aftershocks. Check for gas leaks, damaged electrical wiring, and structural damage. Evacuate if necessary and follow emergency instructions.',
        image: '/images/earthquake-after.jpg',
        imageAlt: 'After earthquake safety'
      }
    ]
  },
  '4': {
    id: '4',
    title: 'Emergency Preparedness',
    description: 'How to prepare your family and home for disasters',
    category: 'Preparedness',
    duration: '25 min',
    icon: <Settings className="w-6 h-6 text-green-500" />,
    steps: [
      {
        id: 1,
        title: 'Create an Emergency Plan',
        content: 'Discuss with your family what to do in different emergency situations. Identify meeting places, escape routes, and communication methods. Practice your plan regularly.',
        image: '/images/prepare-plan.jpg',
        imageAlt: 'Creating emergency plan'
      },
      {
        id: 2,
        title: 'Build an Emergency Kit',
        content: 'Assemble supplies including water (1 gallon per person per day for 3 days), non-perishable food, flashlight, batteries, first aid kit, medications, and important documents.',
        image: '/images/prepare-kit.jpg',
        imageAlt: 'Emergency kit'
      },
      {
        id: 3,
        title: 'Secure Your Home',
        content: 'Anchor heavy furniture and appliances to walls. Install smoke detectors and carbon monoxide alarms. Know how to shut off utilities (gas, water, electricity). Keep fire extinguishers accessible.',
        image: '/images/prepare-secure.jpg',
        imageAlt: 'Securing home'
      },
      {
        id: 4,
        title: 'Stay Informed',
        content: 'Sign up for emergency alerts in your area. Have a battery-powered or hand-crank radio. Follow official sources for updates during emergencies. Know evacuation routes.',
        image: '/images/prepare-informed.jpg',
        imageAlt: 'Staying informed'
      }
    ]
  },
  '5': {
    id: '5',
    title: 'Advanced Rescue Techniques',
    description: 'Professional rescue methods for volunteers',
    category: 'Advanced',
    duration: '45 min',
    icon: <Shield className="w-6 h-6 text-purple-500" />,
    steps: [
      {
        id: 1,
        title: 'Scene Assessment',
        content: 'Evaluate the scene for safety hazards. Identify the number of victims and their conditions. Determine available resources and what additional help is needed. Establish a command structure.',
        image: '/images/rescue-assess.jpg',
        imageAlt: 'Scene assessment'
      },
      {
        id: 2,
        title: 'Victim Triage',
        content: 'Quickly assess and categorize victims based on severity: Immediate (red), Delayed (yellow), Minor (green), and Deceased (black). Treat the most critical first while ensuring scene safety.',
        image: '/images/rescue-triage.jpg',
        imageAlt: 'Victim triage'
      },
      {
        id: 3,
        title: 'Extrication Techniques',
        content: 'Learn safe methods to remove victims from dangerous situations. Use proper body mechanics to prevent injury. Support the head and neck during movement. Work as a team when possible.',
        image: '/images/rescue-extricate.jpg',
        imageAlt: 'Extrication techniques'
      },
      {
        id: 4,
        title: 'Stabilization',
        content: 'Stabilize victims before moving them when possible. Immobilize suspected spinal injuries. Control bleeding and maintain airway. Keep victims warm and monitor vital signs.',
        image: '/images/rescue-stabilize.jpg',
        imageAlt: 'Stabilizing victims'
      },
      {
        id: 5,
        title: 'Team Coordination',
        content: 'Effective communication is crucial. Assign clear roles to team members. Use standard protocols and signals. Document actions taken. Coordinate with emergency services.',
        image: '/images/rescue-team.jpg',
        imageAlt: 'Team coordination'
      }
    ]
  }
}

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params?.id as string
  const [currentStep, setCurrentStep] = useState(0)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  
  const lesson = lessons[lessonId]

  useEffect(() => {
    if (!lesson) {
      router.push('/dashboard')
    }
  }, [lesson, router])

  if (!lesson) {
    return null
  }

  const currentStepData = lesson.steps[currentStep]
  const progress = ((currentStep + 1) / lesson.steps.length) * 100

  const handleCompleteLesson = () => {
    // Mark lesson as completed in sessionStorage (resets on page refresh)
    const completedModules = JSON.parse(sessionStorage.getItem('completedModules') || '[]')
    if (!completedModules.includes(lessonId)) {
      // First time completing - add to completed list and award points
      completedModules.push(lessonId)
      sessionStorage.setItem('completedModules', JSON.stringify(completedModules))
      
      // Add points (10 points per module) - points persist in localStorage
      const currentPoints = parseInt(localStorage.getItem('safetyPoints') || '0')
      const newPoints = currentPoints + 10
      localStorage.setItem('safetyPoints', newPoints.toString())
      
      // Show completion dialog
      setShowCompletionDialog(true)
    } else {
      // Already completed (relearning) - just go back without showing dialog or awarding points
      router.push('/dashboard')
    }
  }

  const handleNext = () => {
    if (currentStep < lesson.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Lesson completed
      handleCompleteLesson()
    }
  }

  const handleCloseDialog = () => {
    setShowCompletionDialog(false)
    router.push('/dashboard')
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            {lesson.icon}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lesson.duration}
                </span>
                <Badge variant="secondary">{lesson.category}</Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {lesson.steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Lesson Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentStepData.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image */}
            {currentStepData.image && (
              <div className="relative w-full h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={currentStepData.image}
                  alt={currentStepData.imageAlt || 'Lesson illustration'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                          <div class="text-center p-8">
                            <div class="text-6xl mb-4">📸</div>
                            <p class="text-gray-600 text-sm">${currentStepData.imageAlt || 'Lesson illustration'}</p>
                            <p class="text-gray-500 text-xs mt-2">Image not found: ${currentStepData.image}</p>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentStepData.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < lesson.steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Lesson
            </Button>
          )}
        </div>

        {/* Step Indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {lesson.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-blue-600'
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Congratulations!</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              You have successfully completed the lesson
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Award className="w-6 h-6" />
                <span className="text-2xl font-bold">+10 Points</span>
              </div>
              <p className="text-sm text-green-600 mt-2">
                You earned 10 points for completing this module!
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Total Points: <span className="font-semibold text-gray-900">
                {typeof window !== 'undefined' ? parseInt(localStorage.getItem('safetyPoints') || '0') : 0}
              </span></p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleCloseDialog} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

