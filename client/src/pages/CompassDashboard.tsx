import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AccessibilityBar from "@/components/AccessibilityBar";
import DecisionFatigueGuard from "@/components/DecisionFatigueGuard";
import InboxWeather from "@/components/compass/InboxWeather";
import RelationalSonar from "@/components/compass/RelationalSonar";
import CommitmentTracker from "@/components/compass/CommitmentTracker";
import EnergyMatching from "@/components/compass/EnergyMatching";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion } from "framer-motion";
import {
  Compass,
  Mail,
  Settings,
  LogOut,
  CreditCard,
  Heart,
  ChevronLeft,
  Inbox,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CompassDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { neuroCode } = useAccessibility();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Compass className="w-12 h-12 text-revvel-gold" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AccessibilityBar />
      <DecisionFatigueGuard />

      {/* Top Navigation */}
      <header className="border-b border-border/50 px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="flex items-center gap-2 text-foreground hover:text-revvel-gold transition-colors">
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/owlCKtVPVNjszaHN.png"
                  alt="Revvel Logo"
                  className="w-8 h-8"
                />
                <span className="font-display text-lg">Revvel</span>
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <Link href="/compass">
              <Button variant="ghost" size="sm" className="text-revvel-gold">
                <Compass className="w-4 h-4 mr-1.5" aria-hidden="true" />
                <span>Compass</span>
              </Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost" size="sm">
                <Inbox className="w-4 h-4 mr-1.5" aria-hidden="true" />
                <span>Inbox</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-1.5" aria-hidden="true" />
                <span>Settings</span>
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" aria-label="Search">
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="sm" aria-label="Notifications">
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Notifications</span>
            </Button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-revvel-forest/40 flex items-center justify-center text-xs font-bold text-revvel-green">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="text-sm text-foreground hidden sm:inline">{user?.name || "User"}</span>
              <Button variant="ghost" size="sm" onClick={() => logout()} aria-label="Sign out">
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl text-foreground mb-2">
            Your Compass
          </h1>
          <p className="text-muted-foreground">
            {neuroCode
              ? "NEURO MODE active — simplified view, guided decisions, break reminders enabled."
              : "Your AI-powered guidance system for a calmer inbox."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <InboxWeather emailCount={34} urgentCount={3} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EnergyMatching />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CommitmentTracker />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RelationalSonar />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h2 className="font-display text-xl text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Mail, label: "Compose Email", href: "/inbox" },
              { icon: Search, label: "Search Inbox", href: "/inbox" },
              { icon: CreditCard, label: "Upgrade Plan", href: "/pricing" },
              { icon: Heart, label: "FOSS Credits", href: "/foss-credits" },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="glass-card-hover p-4 flex flex-col items-center gap-2 text-center cursor-pointer">
                  <action.icon className="w-6 h-6 text-revvel-gold" aria-hidden="true" />
                  <span className="text-sm text-foreground">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
