import { useState, useCallback } from "react";
import { type OnboardingProgress, DEFAULT_PROGRESS } from "@/data/onboardingData";

const STORAGE_PREFIX = "bia_onboarding_";

function getKey(email: string) {
  return `${STORAGE_PREFIX}${email.toLowerCase()}`;
}

function loadProgress(email: string): OnboardingProgress | null {
  try {
    const raw = localStorage.getItem(getKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingProgress;
  } catch {
    return null;
  }
}

function saveProgress(progress: OnboardingProgress) {
  try {
    localStorage.setItem(getKey(progress.email), JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save onboarding progress", e);
  }
}

export function useOnboardingProgress(email: string, name: string) {
  const [progress, setProgressState] = useState<OnboardingProgress>(() => {
    const saved = loadProgress(email);
    if (saved) return { ...saved, name };
    return { ...DEFAULT_PROGRESS, email: email.toLowerCase(), name };
  });

  const updateProgress = useCallback((updater: (prev: OnboardingProgress) => OnboardingProgress) => {
    setProgressState(prev => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  const markVideoComplete = useCallback((videoId: string) => {
    updateProgress(prev => {
      if (prev.completedVideos.includes(videoId)) return prev;
      return { ...prev, completedVideos: [...prev.completedVideos, videoId] };
    });
  }, [updateProgress]);

  const markDayDone = useCallback((day: number) => {
    updateProgress(prev => {
      const key = `day${day}Done` as keyof OnboardingProgress;
      return { ...prev, [key]: true };
    });
  }, [updateProgress]);

  const saveQuizAttempt = useCallback((quizNum: 1 | 2, score: number) => {
    updateProgress(prev => {
      const attemptsKey = `quiz${quizNum}Attempts` as "quiz1Attempts" | "quiz2Attempts";
      const bestKey = `quiz${quizNum}BestScore` as "quiz1BestScore" | "quiz2BestScore";
      const passedKey = `quiz${quizNum}Passed` as "quiz1Passed" | "quiz2Passed";
      const attempts = [...prev[attemptsKey], score];
      const best = Math.max(prev[bestKey], score);
      const passed = best >= 70;
      const next = { ...prev, [attemptsKey]: attempts, [bestKey]: best, [passedKey]: passed };
      
      // Calculate final average if both passed
      if (next.quiz1Passed && next.quiz2Passed) {
        next.finalAverageScore = Math.round((next.quiz1BestScore + next.quiz2BestScore) / 2);
        next.certificateUnlocked = true;
      }
      return next;
    });
  }, [updateProgress]);

  return { progress, markVideoComplete, markDayDone, saveQuizAttempt, updateProgress };
}
