"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "bug", label: "Bug", icon: Bug, emoji: "🐛" },
  { id: "feature", label: "Feature", icon: Lightbulb, emoji: "💡" },
  { id: "general", label: "General", icon: MessageCircle, emoji: "💬" },
] as const;

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname, category, message }),
      });

      if (res.ok) {
        toast.success("Thanks for your feedback!", {
          description: "We'll review it and get back to you.",
        });
        setOpen(false);
        setMessage("");
        setCategory("general");
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl hover:scale-105 active:scale-95"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {/* Feedback dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve DAB! Your feedback goes directly to the team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Category pills */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                What kind of feedback?
              </label>
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      category === cat.id
                        ? "bg-orange-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="feedback-message"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Your feedback
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === "bug"
                    ? "What happened? What did you expect?"
                    : category === "feature"
                      ? "What would make DAB better for you?"
                      : "Tell us what you think..."
                }
                rows={4}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </div>

            {/* Page context (small, subtle) */}
            <p className="text-xs text-zinc-400">
              Page: {pathname}
            </p>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
