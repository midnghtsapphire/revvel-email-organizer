import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AccessibilityBar from "@/components/AccessibilityBar";
import { motion } from "framer-motion";
import { Compass, ArrowRight, Shield, Brain, Leaf, Zap, Users, ListChecks, Cloud, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AccessibilityBar />

      {/* Grain overlay */}
      <div className="grain-overlay fixed inset-0 pointer-events-none" aria-hidden="true" />

      {/* Hero Section - Calm Entry: Max 2 buttons */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url(https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/MKjzbcclTkwfLrtk.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, oklch(0.14 0.008 55 / 70%), oklch(0.14 0.008 55 / 95%))" }} aria-hidden="true" />

        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/owlCKtVPVNjszaHN.png"
              alt="Revvel Compass Logo"
              className="w-20 h-20 mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-foreground leading-tight">
              Your Inbox,{" "}
              <span className="text-gradient-gold">Reimagined</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              The neurodivergent-first email organizer that transforms inbox chaos into calm, focused productivity.
            </p>
          </motion.div>

          {/* Calm Entry: Exactly 2 buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isAuthenticated ? (
              <Link href="/compass">
                <Button size="lg" className="bg-revvel-forest hover:bg-revvel-green text-white px-8 py-6 text-lg rounded-xl">
                  <Compass className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>Open Compass</span>
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-revvel-forest hover:bg-revvel-green text-white px-8 py-6 text-lg rounded-xl">
                  <Compass className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>Get Started Free</span>
                </Button>
              </a>
            )}
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl border-border hover:border-revvel-gold/50 hover:text-revvel-gold">
                <span>View Plans</span>
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Compass Section */}
      <section className="py-20 px-4 relative">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl text-foreground mb-4">
              The <span className="text-gradient-gold">Compass</span> Dashboard
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              An AI-powered guidance system that provides emotional, relational, and productivity context to your inbox. Not just another feature — the heart of Revvel.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Cloud,
                title: "Inbox Weather™",
                description: "At-a-glance visualization of your inbox state using weather analogies. Know if it's Calm Seas or Stormy Waters before you dive in.",
                color: "text-revvel-gold",
              },
              {
                icon: Users,
                title: "Relational Sonar™",
                description: "Intelligent relationship tracker that monitors communication patterns and gently nudges you to maintain important connections.",
                color: "text-revvel-green",
              },
              {
                icon: ListChecks,
                title: "Commitment Tracker™",
                description: "NLP-powered extraction of promises, deadlines, and action items from your emails. Never forget what you committed to.",
                color: "text-revvel-amber",
              },
              {
                icon: Zap,
                title: "Energy Matching™",
                description: "Select your current energy level and get emails matched to your capacity. High Focus, Low Energy, or guided Triage Mode.",
                color: "text-revvel-gold",
              },
              {
                icon: Shield,
                title: "Decision Fatigue Guard™",
                description: "Monitors your activity and proactively suggests breaks after sustained decision-making. Protects your cognitive resources.",
                color: "text-revvel-red",
              },
              {
                icon: Brain,
                title: "Neurodivergent-First",
                description: "Built from the ground up for ADHD, anxiety, and neurodivergent minds. A calmer, more focused experience for everyone.",
                color: "text-revvel-green",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6 space-y-3"
              >
                <feature.icon className={`w-8 h-8 ${feature.color}`} aria-hidden="true" />
                <h3 className="font-display text-lg text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibility Section */}
      <section className="py-20 px-4" style={{ background: "oklch(0.12 0.006 55)" }}>
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6 mb-12"
          >
            <h2 className="font-display text-4xl text-foreground">
              Accessibility is Not an Afterthought
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three always-available modes ensure Revvel works for every mind and every need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Leaf,
                title: "ECO CODE",
                description: "See your CO₂ savings in relatable terms — lattes, tacos, and gas tanks instead of abstract metrics.",
                color: "text-revvel-green",
                bg: "bg-revvel-forest/20",
              },
              {
                icon: Brain,
                title: "NEURO CODE",
                description: "ADHD-friendly mode activating Triage Mode, Energy Matching, and the Decision Fatigue Guard.",
                color: "text-revvel-gold",
                bg: "bg-revvel-amber/20",
              },
              {
                icon: Eye,
                title: "DYSLEXIC MODE",
                description: "OpenDyslexic font, enhanced letter spacing, left-aligned text, and high-contrast colors.",
                color: "text-revvel-red",
                bg: "bg-revvel-burgundy/20",
              },
            ].map((mode, i) => (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 space-y-3 ${mode.bg}`}
              >
                <mode.icon className={`w-8 h-8 ${mode.color} mx-auto`} aria-hidden="true" />
                <h3 className="font-display text-lg text-foreground">{mode.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/owlCKtVPVNjszaHN.png"
              alt="Revvel"
              className="w-6 h-6"
            />
            <span className="text-sm text-muted-foreground">Revvel Email Organizer — Built with FOSS</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/pricing"><span className="hover:text-foreground transition-colors cursor-pointer">Pricing</span></Link>
            <Link href="/foss-credits"><span className="hover:text-foreground transition-colors cursor-pointer">FOSS Credits</span></Link>
            <Link href="/settings"><span className="hover:text-foreground transition-colors cursor-pointer">Settings</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
