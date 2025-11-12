// /data/mockPoints.ts
export interface UserPoints {
  userId: string;
  moduleId: string;
  watched: boolean;
  quizCompleted: boolean;
  earnedPoints: number;
}

export const mockPoints: UserPoints[] = [
  {
    userId: "1",
    moduleId: "1",
    watched: false,
    quizCompleted: false,
    earnedPoints: 0,
  },
  {
    userId: "1",
    moduleId: "2",
    watched: false,
    quizCompleted: false,
    earnedPoints: 0,
  },
  {
    userId: "1",
    moduleId: "3",
    watched: false,
    quizCompleted: false,
    earnedPoints: 0,
  },
];
