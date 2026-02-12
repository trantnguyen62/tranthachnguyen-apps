"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Folder,
  GitBranch,
  Settings,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Home;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ─── Tour Steps ──────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your dashboard!",
    description:
      "This is your control center. Here you can see your projects, deployments, and analytics at a glance.",
    icon: Home,
    position: "center",
  },
  {
    id: "sidebar",
    title: "Sidebar navigation",
    description:
      "Use the sidebar to navigate between different sections: Projects, Deployments, Domains, Analytics, and more.",
    icon: Folder,
    targetSelector: "nav[role='navigation']",
    position: "right",
  },
  {
    id: "projects",
    title: "Your projects",
    description:
      "All your deployed projects appear here. Click on any project to see its deployments, logs, and settings.",
    icon: Folder,
    targetSelector: "a[href='/projects']",
    position: "right",
  },
  {
    id: "deployments",
    title: "Deployments",
    description:
      "View all your deployment history, check build logs, and roll back to previous versions if needed.",
    icon: GitBranch,
    targetSelector: "a[href='/deployments']",
    position: "right",
  },
  {
    id: "settings",
    title: "Settings",
    description:
      "Configure your account, connect Git providers, manage domains, environment variables, and team members.",
    icon: Settings,
    targetSelector: "a[href='/settings']",
    position: "right",
  },
];

const TOUR_STORAGE_KEY = "cloudify-guided-tour-completed";

// ─── Component ───────────────────────────────────────────────────────

export function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Position the tooltip relative to the target element
  const updatePosition = useCallback(() => {
    if (!currentStep) return;

    if (currentStep.position === "center" || !currentStep.targetSelector) {
      setHighlightRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 175,
      });
      return;
    }

    const target = document.querySelector(currentStep.targetSelector);
    if (!target) {
      setHighlightRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 175,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    setHighlightRect(rect);

    const tooltipWidth = 350;
    const tooltipHeight = 180;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case "bottom":
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
    }

    // Clamp within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPosition({ top, left });
  }, [currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onSkip();
  };

  if (!isVisible || !currentStep) return null;

  const StepIcon = currentStep.icon;

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={handleSkip}
      />

      {/* Highlight cutout for targeted element */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[101] border-2 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[102] w-[350px] bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-xl shadow-2xl p-5"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 shrink-0">
              <StepIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                {currentStep.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStepIndex ? "bg-blue-500" : "bg-[var(--surface-secondary)]"
                  }`}
                />
              ))}
              <span className="text-xs text-[var(--text-secondary)] ml-2">
                {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button variant="ghost" size="sm" onClick={handlePrev}>
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              )}
              {isFirstStep && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip tour
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ArrowRight className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// ─── Hook to Check Tour Status ───────────────────────────────────────

export function useGuidedTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setShouldShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    setShouldShowTour(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  }, []);

  return { shouldShowTour, completeTour };
}
