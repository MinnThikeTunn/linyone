"use client";

import { useEffect, useState } from "react";
import { mockSafetyModules } from "@/data/mockSafetyModules";
import { mockPoints } from "@/data/mockPoint";
import * as React from "react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Award } from "lucide-react";

interface ModuleDetailProps {
  params: { moduleId: string };
}

export default function ModuleDetail({ params }: ModuleDetailProps) {
  // `params` may be a Promise in this Next.js version; unwrap with React.use()
  // before accessing properties.
  // See Next.js migration guidance: use React.use(params) in client components.
  const resolvedParams = React.use(params as any) as { moduleId: string };
  const moduleId = resolvedParams.moduleId;

  const course = mockSafetyModules.find((m) => m.id.toString() === moduleId);

  const userId = "2"; // Simulate logged-in user

  const [activeTab, setActiveTab] = useState("video");
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showResult, setShowResult] = useState(false);

  // Load user points (from mock data or localStorage)
  const [userPoints, setUserPoints] = useState(() => {
    const saved = localStorage.getItem(`points-${userId}-${params.moduleId}`);
    if (saved) return JSON.parse(saved);
    return mockPoints.find(
      (p) => p.userId === userId && p.moduleId === params.moduleId
    );
  });

  const result = course?.quiz?.every((_, i) => selectedAnswers[i]);
  const score =
    course?.quiz?.filter((q, i) => selectedAnswers[i] === q.answer).length ?? 0;
  const allCompleted = userPoints?.watched && userPoints?.quizCompleted;

  // Save progress in localStorage
  useEffect(() => {
    if (userPoints) {
      localStorage.setItem(
        `points-${userId}-${params.moduleId}`,
        JSON.stringify(userPoints)
      );
    }
  }, [userPoints, userId, params.moduleId]);

  // Handle video completion
  const handleVideoEnd = () => {
    setUserPoints((prev) => {
      if (prev?.watched) return prev; // prevent double counting

      const updated = {
        ...prev!,
        watched: true,
        earnedPoints: (prev?.earnedPoints ?? 0) + 5,
      };

      console.log(" Video completed, +5 points");
      return updated;
    });
  };

  // Handle quiz completion
  const handleQuizSubmit = () => {
    setUserPoints((prev) => {
      if (prev?.quizCompleted) return prev;

      let pointsEarned = 3; // base points for completing quiz
      if (score === course?.quiz?.length) pointsEarned += 2; // bonus for all correct

      const updated = {
        ...prev!,
        quizCompleted: true,
        earnedPoints: (prev?.earnedPoints ?? 0) + pointsEarned,
      };

      console.log(`Quiz completed, +${pointsEarned} points`);
      return updated;
    });

    setShowResult(true);
  };

  if (!course) return <p className="p-4 text-red-500">Module not found</p>;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      {/* <div className="grid grid-cols-3 w-full h-24 p-3 rounded-lg shadow-md bg-blue-800">
        <div className="col-span-2">
          <h1 className="text-lg text-white font-semibold">{course.title}</h1>
        </div>
        <div className="flex items-center justify-center text-sm bg-white rounded-lg shadow px-2">
          <Award className="w-4 h-4"></Award>
          Earned Points:
          <span className="font-semibold">
            {" "}
            {userPoints?.earnedPoints ?? 0}
          </span>
        </div>
        <div className="text-gray-600 col-span-3">{course.category}</div>
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-3 w-full h-auto sm:h-24 p-3 sm:p-4 rounded-lg shadow-md bg-blue-800 gap-2 sm:gap-0">
        {/* Title */}
        <div className="sm:col-span-2 flex items-center">
          <h1 className="text-base sm:text-lg text-white font-semibold">
            {course.title}
          </h1>
        </div>

        {/* Earned Points */}
        <div className="flex items-center justify-center text-xs sm:text-sm bg-white rounded-lg shadow px-2 py-1 sm:py-0">
          <Award className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Earned Points:</span>
          <span className="font-semibold text-blue-800 ml-1">
            {userPoints?.earnedPoints ?? 0}
          </span>
        </div>

        {/* Category */}
        <div className="text-gray-200 text-sm sm:col-span-3 text-center sm:text-left">
          {course.category}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-sm font-semibold overflow-x-auto my-4">
        {["video", "quiz", "Q&A"].map((tab) => (
          <button
            key={tab}
            className={`px-3 py-2 rounded-lg whitespace-nowrap w-1/3 ${
              activeTab === tab
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[250px]">
        {/* 🎥 Video Tab */}
        {activeTab === "video" && course.videoUrl && (
          <div>
            <iframe
              className="w-full h-80 rounded-lg"
              src={course.videoUrl}
              title={course.title}
              allowFullScreen
            ></iframe>

            <button
              onClick={handleVideoEnd}
              className="mt-3 px-4 py-2 bg-green-300 text-white rounded w-full"
            >
              Mark Video as Watched
            </button>
          </div>
        )}

        {/* 🧠 Quiz Tab */}
        {activeTab === "quiz" && course.quiz?.length ? (
          <div className="space-y-4">
            {course.quiz.map((q, index) => (
              <div key={index} className="p-3 border rounded space-y-2">
                <p className="font-semibold">{q.question}</p>
                {q.options.map((opt, optIndex) => (
                  <label
                    key={optIndex}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={opt}
                      checked={selectedAnswers[index] === opt}
                      onChange={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [index]: opt,
                        }))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}

            {result && (
              <button
                onClick={handleQuizSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded w-full"
              >
                Submit Quiz
              </button>
            )}
          </div>
        ) : activeTab === "quiz" ? (
          <p>No quiz available yet.</p>
        ) : null}

        {/* Quiz Result Dialog */}
        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">Quiz Result</DialogTitle>
            </DialogHeader>
            <p className="text-center text-xl font-semibold mt-2">
              You got <span className="text-blue-600">{score}</span> /{" "}
              {course?.quiz?.length} correct 🎉
            </p>
            <p className="text-center mt-2">
              Total Points:{" "}
              <span className="font-semibold text-green-600">
                {userPoints?.earnedPoints ?? 0}
              </span>
            </p>

            <div className="text-center mt-4">
              <button
                onClick={() => setShowResult(false)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 💬 Q&A Tab */}
        {activeTab === "Q&A" && course.qna?.length ? (
          <Accordion type="single" collapsible className="w-full">
            {course.qna.map((q, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>Q: {q.question}</AccordionTrigger>
                <AccordionContent>A: {q.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : activeTab === "Q&A" ? (
          <p>No Q&A available yet.</p>
        ) : null}

        {/* 🎯 Completion Message */}
        {allCompleted && (
          <div className="text-center mt-6 p-3 rounded-lg bg-green-100 text-green-700 font-semibold">
            🎉 You’ve completed this module and earned{" "}
            {userPoints?.earnedPoints ?? 0} points!
          </div>
        )}
      </div>
    </div>
  );
}
