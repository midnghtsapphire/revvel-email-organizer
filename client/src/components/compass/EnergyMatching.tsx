import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Battery, BatteryLow, Focus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type EnergyLevel = "high-focus" | "low-energy" | "triage";

interface EnergyMatchingProps {
  onSelectEnergy?: (level: EnergyLevel) => void;
  currentLevel?: EnergyLevel | null;
}

const energyModes = [
  {
    id: "high-focus" as EnergyLevel,
    label: "High Focus",
    icon: Zap,
    color: "text-revvel-gold",
    bg: "bg-revvel-gold/15 border-revvel-gold/30",
    activeBg: "bg-revvel-gold/25 border-revvel-gold/50 border-glow-gold",
    description: "Complex emails requiring deep thought",
    count: 8,
  },
  {
    id: "low-energy" as EnergyLevel,
    label: "Low Energy",
    icon: BatteryLow,
    color: "text-revvel-green",
    bg: "bg-revvel-forest/15 border-revvel-green/30",
    activeBg: "bg-revvel-forest/25 border-revvel-green/50",
    description: "Quick tasks: archive, one-line replies",
    count: 23,
  },
  {
    id: "triage" as EnergyLevel,
    label: "Triage Mode",
    icon: Focus,
    color: "text-revvel-amber",
    bg: "bg-revvel-amber/15 border-revvel-amber/30",
    activeBg: "bg-revvel-amber/25 border-revvel-amber/50",
    description: "One email at a time, guided decisions",
    count: 45,
  },
];

export default function EnergyMatching({ onSelectEnergy, currentLevel }: EnergyMatchingProps) {
  const [selected, setSelected] = useState<EnergyLevel | null>(currentLevel || null);

  const handleSelect = (level: EnergyLevel) => {
    setSelected(level);
    onSelectEnergy?.(level);
  };

  return (
    <div className="glass-card-hover p-6 space-y-4" role="region" aria-label="Energy Matching">
      <div className="flex items-center gap-3">
        <Battery className="w-8 h-8 text-revvel-gold" aria-hidden="true" />
        <div>
          <h3 className="font-display text-lg text-foreground">Energy Matching™</h3>
          <p className="text-xs text-muted-foreground">How are you feeling right now?</p>
        </div>
      </div>

      <div className="space-y-2">
        {energyModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = selected === mode.id;
          return (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelect(mode.id)}
              aria-pressed={isActive}
              aria-label={`${mode.label}: ${mode.description}`}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                isActive ? mode.activeBg : mode.bg
              }`}
            >
              <Icon className={`w-5 h-5 ${mode.color} shrink-0`} aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{mode.label}</p>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{mode.count} emails</span>
                {isActive && <ArrowRight className={`w-4 h-4 ${mode.color}`} aria-hidden="true" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button className="w-full bg-revvel-forest hover:bg-revvel-green text-white">
            <span>Start {energyModes.find(m => m.id === selected)?.label}</span>
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
