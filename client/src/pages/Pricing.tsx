import AccessibilityBar from "@/components/AccessibilityBar";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Compass, Zap, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { toast } from "sonner";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Compass,
    description: "Perfect for getting started with a calmer inbox.",
    color: "border-revvel-green/30",
    features: [
      "Unified Inbox (2 accounts)",
      "Smart Filing (basic)",
      "The Screener",
      "Basic AI (50 actions/mo)",
      "ECO CODE & NEURO CODE",
      "DYSLEXIC MODE",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/month",
    icon: Zap,
    description: "Full power for focused professionals and freelancers.",
    color: "border-revvel-gold/50",
    features: [
      "Unlimited email accounts",
      "Full AI capabilities",
      "The Compass (all features)",
      "Inbox Weather™",
      "Relational Sonar™",
      "Commitment Tracker™",
      "Energy Matching™",
      "Decision Fatigue Guard™",
      "Advanced Search (NLP)",
      "Email Analytics",
      "AI Drafts & Summarization",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$25",
    period: "/user/month",
    icon: Users,
    description: "Collaboration tools for small businesses and teams.",
    color: "border-revvel-amber/30",
    features: [
      "All Pro features",
      "Shared Inboxes",
      "Collaborative Drafts",
      "Email Assignments",
      "Team Analytics",
      "Admin controls",
      "SSO integration",
      "Dedicated support",
    ],
    cta: "Start Team Trial",
    popular: false,
  },
];

export default function Pricing() {
  const handleSubscribe = (tier: string) => {
    toast.info(`Stripe checkout for ${tier} plan coming soon. Connect your Stripe keys in Settings.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AccessibilityBar />

      <header className="border-b border-border/50 px-4 py-3">
        <div className="container flex items-center gap-4">
          <Link href="/">
            <span className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="container py-16 max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">
            Simple, <span className="text-gradient-gold">Transparent</span> Pricing
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start free. Upgrade when you need the full power of The Compass.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 space-y-6 border ${tier.color} relative ${
                tier.popular ? "border-glow-gold" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-revvel-gold text-revvel-charcoal text-xs font-bold">
                  <Star className="w-3 h-3" aria-hidden="true" />
                  <span>Most Popular</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <tier.icon className="w-5 h-5 text-revvel-gold" aria-hidden="true" />
                  <h2 className="font-display text-xl text-foreground">{tier.name}</h2>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <ul className="space-y-2" role="list" aria-label={`${tier.name} features`}>
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-revvel-green shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(tier.name)}
                className={`w-full ${
                  tier.popular
                    ? "bg-revvel-forest hover:bg-revvel-green text-white"
                    : ""
                }`}
                variant={tier.popular ? "default" : "outline"}
              >
                <span>{tier.cta}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
