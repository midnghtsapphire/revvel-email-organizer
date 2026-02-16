import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DecisionFatigueGuard() {
  const { shouldTakeBreak, dismissBreakReminder, decisionsThisSession } = useAccessibility();

  return (
    <AnimatePresence>
      {shouldTakeBreak && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 60%)" }}
          role="alertdialog"
          aria-label="Decision Fatigue Guard - Break Reminder"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="glass-card p-8 max-w-md w-full text-center space-y-6"
          >
            <div className="flex justify-end">
              <button
                onClick={dismissBreakReminder}
                aria-label="Dismiss break reminder"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-revvel-amber/20 flex items-center justify-center">
                <Coffee className="w-8 h-8 text-revvel-gold" aria-hidden="true" />
              </div>
            </div>

            <h2 className="text-2xl font-display text-foreground">
              Time for a Breather
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              You've made <span className="text-revvel-gold font-semibold">{decisionsThisSession} decisions</span> this session.
              Your brain deserves a moment of calm. Step away, stretch, or grab a drink.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={dismissBreakReminder}
                className="w-full bg-revvel-forest hover:bg-revvel-green text-white"
              >
                <Timer className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>Take a 5-Minute Break</span>
              </Button>
              <Button
                variant="outline"
                onClick={dismissBreakReminder}
                className="w-full"
              >
                <span>I'm Good, Continue</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
