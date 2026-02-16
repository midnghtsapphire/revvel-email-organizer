import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface AccessibilityState {
  ecoCode: boolean;
  neuroCode: boolean;
  dyslexicMode: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  toggleEcoCode: () => void;
  toggleNeuroCode: () => void;
  toggleDyslexicMode: () => void;
  decisionsThisSession: number;
  incrementDecisions: () => void;
  resetDecisions: () => void;
  shouldTakeBreak: boolean;
  dismissBreakReminder: () => void;
  co2Saved: { tacos: number; lattes: number; gasTanks: number; kg: number };
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const DECISION_THRESHOLD = 25;
const CO2_PER_EMAIL_ACTION_KG = 0.004; // ~4g CO2 per email action saved

function calculateCO2Equivalents(totalActions: number) {
  const kg = totalActions * CO2_PER_EMAIL_ACTION_KG;
  return {
    kg: Math.round(kg * 100) / 100,
    tacos: Math.round(kg / 0.5 * 10) / 10,     // ~0.5kg CO2 per taco
    lattes: Math.round(kg / 0.21 * 10) / 10,    // ~0.21kg CO2 per latte
    gasTanks: Math.round(kg / 8.89 * 100) / 100, // ~8.89kg CO2 per gallon
  };
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(() => {
    try {
      const saved = localStorage.getItem("revvel-accessibility");
      return saved ? JSON.parse(saved) : { ecoCode: false, neuroCode: false, dyslexicMode: false };
    } catch {
      return { ecoCode: false, neuroCode: false, dyslexicMode: false };
    }
  });

  const [decisionsThisSession, setDecisions] = useState(0);
  const [shouldTakeBreak, setShouldTakeBreak] = useState(false);
  const [totalActions, setTotalActions] = useState(() => {
    try {
      return parseInt(localStorage.getItem("revvel-total-actions") || "0", 10);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem("revvel-accessibility", JSON.stringify(state));
    if (state.dyslexicMode) {
      document.documentElement.classList.add("dyslexic-mode");
    } else {
      document.documentElement.classList.remove("dyslexic-mode");
    }
  }, [state]);

  useEffect(() => {
    localStorage.setItem("revvel-total-actions", String(totalActions));
  }, [totalActions]);

  const toggleEcoCode = useCallback(() => setState(s => ({ ...s, ecoCode: !s.ecoCode })), []);
  const toggleNeuroCode = useCallback(() => setState(s => ({ ...s, neuroCode: !s.neuroCode })), []);
  const toggleDyslexicMode = useCallback(() => setState(s => ({ ...s, dyslexicMode: !s.dyslexicMode })), []);

  const incrementDecisions = useCallback(() => {
    setDecisions(d => {
      const next = d + 1;
      if (next >= DECISION_THRESHOLD && state.neuroCode) {
        setShouldTakeBreak(true);
      }
      return next;
    });
    setTotalActions(t => t + 1);
  }, [state.neuroCode]);

  const resetDecisions = useCallback(() => {
    setDecisions(0);
    setShouldTakeBreak(false);
  }, []);

  const dismissBreakReminder = useCallback(() => {
    setShouldTakeBreak(false);
    setDecisions(0);
  }, []);

  const co2Saved = calculateCO2Equivalents(totalActions);

  return (
    <AccessibilityContext.Provider
      value={{
        ...state,
        toggleEcoCode,
        toggleNeuroCode,
        toggleDyslexicMode,
        decisionsThisSession,
        incrementDecisions,
        resetDecisions,
        shouldTakeBreak,
        dismissBreakReminder,
        co2Saved,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
