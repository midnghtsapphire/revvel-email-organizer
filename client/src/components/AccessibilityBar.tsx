import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Leaf, Brain, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccessibilityBar() {
  const {
    ecoCode,
    neuroCode,
    dyslexicMode,
    toggleEcoCode,
    toggleNeuroCode,
    toggleDyslexicMode,
    co2Saved,
  } = useAccessibility();

  return (
    <div
      role="toolbar"
      aria-label="Accessibility Controls"
      className="w-full border-b border-border/50 px-4 py-1.5"
      style={{ background: "oklch(0.12 0.006 55 / 90%)" }}
    >
      <div className="container flex items-center justify-between gap-2">
        {/* Left: Eco stats */}
        <AnimatePresence>
          {ecoCode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-xs text-revvel-green flex items-center gap-2"
            >
              <span aria-live="polite">
                🌿 {co2Saved.kg}kg CO₂ saved ≈ {co2Saved.lattes} lattes · {co2Saved.tacos} tacos · {co2Saved.gasTanks} gas tanks
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Toggle buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={toggleEcoCode}
            aria-pressed={ecoCode}
            aria-label="Toggle ECO CODE - Show CO2 savings"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              ecoCode
                ? "bg-revvel-forest/30 text-revvel-green border border-revvel-green/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ECO CODE</span>
          </button>

          <button
            onClick={toggleNeuroCode}
            aria-pressed={neuroCode}
            aria-label="Toggle NEURO CODE - ADHD-friendly mode"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              neuroCode
                ? "bg-revvel-amber/20 text-revvel-gold border border-revvel-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Brain className="w-3.5 h-3.5" aria-hidden="true" />
            <span>NEURO CODE</span>
          </button>

          <button
            onClick={toggleDyslexicMode}
            aria-pressed={dyslexicMode}
            aria-label="Toggle DYSLEXIC MODE - OpenDyslexic font"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              dyslexicMode
                ? "bg-revvel-burgundy/30 text-revvel-red border border-revvel-red/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>DYSLEXIC MODE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
