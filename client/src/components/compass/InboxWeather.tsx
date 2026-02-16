import { motion } from "framer-motion";
import { Cloud, CloudRain, Sun, CloudLightning, Wind } from "lucide-react";

type WeatherState = "calm" | "light-chop" | "breezy" | "stormy" | "hurricane";

interface InboxWeatherProps {
  state?: WeatherState;
  emailCount?: number;
  urgentCount?: number;
  sentiment?: number; // -1 to 1
}

const weatherConfig: Record<WeatherState, { icon: typeof Sun; label: string; color: string; description: string }> = {
  calm: {
    icon: Sun,
    label: "Calm Seas",
    color: "text-revvel-gold",
    description: "Your inbox is peaceful. A great time for deep work.",
  },
  "light-chop": {
    icon: Cloud,
    label: "Light Chop",
    color: "text-revvel-cream",
    description: "A few things need attention, but nothing urgent.",
  },
  breezy: {
    icon: Wind,
    label: "Breezy",
    color: "text-revvel-amber",
    description: "Some activity picking up. Consider triaging soon.",
  },
  stormy: {
    icon: CloudRain,
    label: "Stormy Waters",
    color: "text-revvel-red",
    description: "Multiple urgent items. Focus on what matters most.",
  },
  hurricane: {
    icon: CloudLightning,
    label: "Hurricane Warning",
    color: "text-destructive",
    description: "Inbox overload detected. Let's tackle this together.",
  },
};

function getWeatherState(emailCount: number, urgentCount: number): WeatherState {
  if (urgentCount > 10 || emailCount > 100) return "hurricane";
  if (urgentCount > 5 || emailCount > 50) return "stormy";
  if (urgentCount > 2 || emailCount > 25) return "breezy";
  if (emailCount > 10) return "light-chop";
  return "calm";
}

export default function InboxWeather({ state, emailCount = 0, urgentCount = 0 }: InboxWeatherProps) {
  const weatherState = state || getWeatherState(emailCount, urgentCount);
  const config = weatherConfig[weatherState];
  const Icon = config.icon;

  return (
    <div className="glass-card-hover p-6 space-y-4" role="region" aria-label="Inbox Weather">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: weatherState === "calm" ? [0, 5, -5, 0] : [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: weatherState === "calm" ? 4 : 2 }}
        >
          <Icon className={`w-10 h-10 ${config.color}`} aria-hidden="true" />
        </motion.div>
        <div>
          <h3 className="font-display text-lg text-foreground">Inbox Weather™</h3>
          <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{config.description}</p>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{emailCount} unread</span>
        <span className="text-border">·</span>
        <span className={urgentCount > 0 ? "text-revvel-red" : ""}>{urgentCount} urgent</span>
      </div>
    </div>
  );
}
