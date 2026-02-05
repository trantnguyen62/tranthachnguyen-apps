"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FeedbackType = "positive" | "negative" | null;

export function Feedback() {
  const pathname = usePathname();
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [showTextarea, setShowTextarea] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: FeedbackType) => {
    setFeedback(type);

    // Store feedback in localStorage
    try {
      const feedbackData = JSON.parse(localStorage.getItem("cloudify-docs-feedback") || "{}");
      feedbackData[pathname] = { type, timestamp: Date.now() };
      localStorage.setItem("cloudify-docs-feedback", JSON.stringify(feedbackData));
    } catch (e) {
      // Ignore localStorage errors
    }

    // Show textarea for negative feedback
    if (type === "negative") {
      setShowTextarea(true);
    } else {
      setSubmitted(true);
    }
  };

  const handleSubmitComment = () => {
    // Store comment in localStorage
    try {
      const feedbackData = JSON.parse(localStorage.getItem("cloudify-docs-feedback") || "{}");
      feedbackData[pathname] = {
        ...feedbackData[pathname],
        comment,
        commentTimestamp: Date.now(),
      };
      localStorage.setItem("cloudify-docs-feedback", JSON.stringify(feedbackData));
    } catch (e) {
      // Ignore localStorage errors
    }

    setShowTextarea(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          mt-12 py-6
          border-t border-border-light
          text-center
        "
      >
        <p className="text-body text-foreground-secondary">
          Thanks for your feedback! It helps us improve our documentation.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="mt-12 py-6 border-t border-border-light">
      <AnimatePresence mode="wait">
        {!feedback && (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <p className="text-body text-foreground-secondary">
              Was this page helpful?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback("positive")}
                className="
                  flex items-center gap-2 px-4 py-2
                  rounded-lg border border-border
                  text-body-sm text-foreground
                  transition-all duration-fast
                  hover:bg-success/10 hover:border-success hover:text-success
                "
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Yes</span>
              </button>
              <button
                onClick={() => handleFeedback("negative")}
                className="
                  flex items-center gap-2 px-4 py-2
                  rounded-lg border border-border
                  text-body-sm text-foreground
                  transition-all duration-fast
                  hover:bg-error/10 hover:border-error hover:text-error
                "
              >
                <ThumbsDown className="w-4 h-4" />
                <span>No</span>
              </button>
            </div>
          </motion.div>
        )}

        {showTextarea && (
          <motion.div
            key="textarea"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-lg mx-auto"
          >
            <p className="text-body text-foreground mb-3 text-center">
              How can we improve this page?
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what was missing or confusing..."
              className="
                w-full h-24 px-4 py-3
                bg-background
                border border-border rounded-xl
                text-body text-foreground
                placeholder:text-foreground-secondary
                resize-none
                transition-all duration-fast
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              "
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowTextarea(false);
                  setSubmitted(true);
                }}
                className="
                  px-4 py-2
                  rounded-lg
                  text-body-sm text-foreground-secondary
                  transition-colors duration-fast
                  hover:bg-background-secondary
                "
              >
                Skip
              </button>
              <button
                onClick={handleSubmitComment}
                disabled={!comment.trim()}
                className="
                  flex items-center gap-2 px-4 py-2
                  rounded-lg
                  text-body-sm font-medium text-white
                  bg-accent
                  transition-all duration-fast
                  hover:bg-accent-hover
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Send className="w-4 h-4" />
                <span>Submit</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
