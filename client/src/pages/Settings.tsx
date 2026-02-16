import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AccessibilityBar from "@/components/AccessibilityBar";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Brain,
  Leaf,
  Eye,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const {
    ecoCode, neuroCode, dyslexicMode,
    toggleEcoCode, toggleNeuroCode, toggleDyslexicMode,
  } = useAccessibility();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AccessibilityBar />

      <header className="border-b border-border/50 px-4 py-3">
        <div className="container flex items-center gap-4">
          <Link href="/compass">
            <span className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Compass</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="container py-12 max-w-2xl mx-auto px-4 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your Revvel experience.</p>
        </motion.div>

        {/* Profile */}
        <section className="glass-card p-6 space-y-4" aria-labelledby="profile-heading">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-revvel-gold" aria-hidden="true" />
            <h2 id="profile-heading" className="font-display text-lg text-foreground">Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground">{user?.name || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Plan</span>
              <Link href="/pricing">
                <span className="text-revvel-gold cursor-pointer hover:underline">Free — Upgrade</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="glass-card p-6 space-y-4" aria-labelledby="accounts-heading">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-revvel-gold" aria-hidden="true" />
            <h2 id="accounts-heading" className="font-display text-lg text-foreground">Connected Accounts</h2>
          </div>
          <p className="text-sm text-muted-foreground">Connect your Gmail account to start organizing.</p>
          <Button
            variant="outline"
            onClick={() => toast.info("Gmail OAuth integration ready. Configure GOOGLE_CLIENT_ID in environment.")}
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Connect Gmail Account</span>
          </Button>
        </section>

        {/* Accessibility */}
        <section className="glass-card p-6 space-y-4" aria-labelledby="accessibility-heading">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-revvel-gold" aria-hidden="true" />
            <h2 id="accessibility-heading" className="font-display text-lg text-foreground">Accessibility</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-revvel-green" aria-hidden="true" />
                <div>
                  <p className="text-sm text-foreground">ECO CODE</p>
                  <p className="text-xs text-muted-foreground">Show CO₂ savings in relatable terms</p>
                </div>
              </div>
              <Switch checked={ecoCode} onCheckedChange={toggleEcoCode} aria-label="Toggle ECO CODE" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-revvel-gold" aria-hidden="true" />
                <div>
                  <p className="text-sm text-foreground">NEURO CODE</p>
                  <p className="text-xs text-muted-foreground">ADHD-friendly mode with break reminders</p>
                </div>
              </div>
              <Switch checked={neuroCode} onCheckedChange={toggleNeuroCode} aria-label="Toggle NEURO CODE" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-revvel-red" aria-hidden="true" />
                <div>
                  <p className="text-sm text-foreground">DYSLEXIC MODE</p>
                  <p className="text-xs text-muted-foreground">OpenDyslexic font, enhanced spacing</p>
                </div>
              </div>
              <Switch checked={dyslexicMode} onCheckedChange={toggleDyslexicMode} aria-label="Toggle DYSLEXIC MODE" />
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={() => logout()}
          className="w-full text-destructive hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
          <span>Sign Out</span>
        </Button>
      </main>
    </div>
  );
}
