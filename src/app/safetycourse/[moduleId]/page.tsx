"use client";

import { useState } from "react";
import { mockSafetyModules } from "@/data/mockSafetyModules";
import { Progress } from "@/components/ui/progress";
import { mock } from "node:test";
import { se } from "date-fns/locale";
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

interface ModuleDetailProps {
  params: { moduleId: string };
}

export default function ModuleDetail({ params }: ModuleDetailProps) {
  const course = mockSafetyModules.find(
    (m) => m.id.toString() === params.moduleId
  );

  // const course = mockSafetyModules.find((m) => m.id === m.id);
  const [activeTab, setActiveTab] = useState("video");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  //show result after all question is done
  const result = course?.quiz?.every((_, i) => selectedAnswers[i]);

  const score = course?.quiz?.filter(
    (q, i) => selectedAnswers[i] === q.answer
  ).length;

  console.log("params.moduleId:", params.moduleId);
  console.log(
    "mockSafetyModules IDs:",
    mockSafetyModules.map((m) => m.id)
  );

  if (!course) return <p className="p-4 text-red-500">Module not found</p>;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-base font-bold">{course.title}</h1>
      <p className="text-gray-500">
        {course.category} • {course.duration}
      </p>

      {/* <Progress value={course.progress} className="h-2" /> */}
      {course.dailyStreak && (
        <p className="text-green-600">🔥 Daily Streak: {course.dailyStreak}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-2 text-sm font-semibold overflow-x-auto my-4">
        {["video", "quiz", "Q&A"].map((tab) => (
          <button
            key={tab}
            className={`px-3 py-2 rounded-lg whitespace-nowrap w-1/3 ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="min-h-[250px]">
        {/* Video Tab */}
        {activeTab === "video" && course.videoUrl && (
          <iframe
            className="w-full h-80 rounded-lg"
            src={course.videoUrl}
            title={course.title}
            allowFullScreen
          ></iframe>
        )}

        {/* Quiz Tab */}
        {activeTab === "quiz" && course.quiz?.length ? (
          <div className="space-y-4">
            {course.quiz.map((q, index) => (
              <div key={index} className="p-3 border rounded space-y-2">
                <p className="font-semibold">{q.question}</p>

                {/* Options */}
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
                      className="text-blue-600"
                    />
                    {opt}
                  </label>
                ))}

                {/* Show correct/incorrect feedback */}
                {selectedAnswers[index] && (
                  <p
                    className={`mt-2 font-medium ${
                      selectedAnswers[index] === q.answer
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedAnswers[index] === q.answer
                      ? " Correct!"
                      : ` Incorrect. Answer: ${q.answer}`}
                  </p>
                )}
              </div>
            ))}

            {/* Submit Button (only appears when all answered) */}
            {result && (
              <button
                onClick={() => setShowResult(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded w-full"
              >
                Submit Quiz
              </button>
            )}
          </div>
        ) : activeTab === "quiz" ? (
          <p>No quiz available yet.</p>
        ) : null}

        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">Quiz Result</DialogTitle>
            </DialogHeader>

            <p className="text-center text-xl font-semibold mt-2">
              You got <span className="text-blue-600">{score}</span> /{" "}
              {course?.quiz?.length} correct 🎉
            </p>

            <p className="text-center mt-4 text-gray-700">
              {score === course?.quiz?.length
                ? "Excellent! You're a star! 🌟"
                : (score as number) >= (course?.quiz?.length as number) / 2
                ? "Nice work! Keep improving 💪"
                : "Don't worry — keep learning! You got this ❤️"}
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

        {/* Q&A Tab */}
        {activeTab === "Q&A" && course.qna?.length ? (
          <Accordion type="single" collapsible className="w-full">
            {course.qna.map((q, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="font-semibold text-left">
                  Q: {q.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  A: {q.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : activeTab === "qna" ? (
          <p>No Q&A available yet.</p>
        ) : null}
      </div>
    </div>
  );
}
