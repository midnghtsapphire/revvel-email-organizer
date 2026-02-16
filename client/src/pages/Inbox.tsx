import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AccessibilityBar from "@/components/AccessibilityBar";
import DecisionFatigueGuard from "@/components/DecisionFatigueGuard";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion } from "framer-motion";
import {
  Mail,
  Star,
  Archive,
  Clock,
  Reply,
  Trash2,
  Search,
  Filter,
  Compass,
  Settings,
  Inbox as InboxIcon,
  ChevronLeft,
  LogOut,
  Bell,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  isRead: boolean;
  isStarred: boolean;
  category: string;
  isUrgent: boolean;
}

const demoEmails: EmailItem[] = [
  { id: "1", from: "Audrey Evans", fromEmail: "audrey@example.com", subject: "Q3 Budget Review — Action Required", preview: "Hi, I wanted to follow up on the Q3 budget report we discussed last week. Could you send me the updated figures by...", time: "10:23 AM", isRead: false, isStarred: true, category: "Work", isUrgent: true },
  { id: "2", from: "Jordan Mitchell", fromEmail: "jordan@example.com", subject: "Team Standup Notes", preview: "Here are the notes from today's standup. Key action items: 1) Finalize the API integration, 2) Review the...", time: "9:45 AM", isRead: false, isStarred: false, category: "Work", isUrgent: false },
  { id: "3", from: "GitHub", fromEmail: "noreply@github.com", subject: "[revvel-email-organizer] PR #42 merged", preview: "Pull request #42 has been merged into main. Changes include the new Compass Dashboard components and...", time: "Yesterday", isRead: true, isStarred: false, category: "Notifications", isUrgent: false },
  { id: "4", from: "Sam Chen", fromEmail: "sam@example.com", subject: "Re: Project Timeline Update", preview: "Thanks for the update. I think we should push the deadline back by a week to ensure quality. What do you...", time: "Yesterday", isRead: true, isStarred: false, category: "Work", isUrgent: false },
  { id: "5", from: "Stripe", fromEmail: "receipts@stripe.com", subject: "Your receipt from Revvel Pro", preview: "Thank you for your subscription to Revvel Pro. Your monthly charge of $15.00 has been processed...", time: "Feb 14", isRead: true, isStarred: false, category: "Receipts", isUrgent: false },
  { id: "6", from: "Newsletter Weekly", fromEmail: "digest@newsletter.com", subject: "This Week in Tech: AI Email Revolution", preview: "The future of email is here. New AI-powered tools are transforming how we manage our inboxes, with a focus on...", time: "Feb 13", isRead: true, isStarred: false, category: "Newsletters", isUrgent: false },
];

export default function Inbox() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { neuroCode, incrementDecisions } = useAccessibility();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [emails, setEmails] = useState(demoEmails);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleAction = (action: string, emailId: string) => {
    incrementDecisions();
    if (action === "archive") {
      setEmails(prev => prev.filter(e => e.id !== emailId));
      toast.success("Email archived");
    } else if (action === "star") {
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isStarred: !e.isStarred } : e));
    } else if (action === "delete") {
      setEmails(prev => prev.filter(e => e.id !== emailId));
      toast.success("Email deleted");
    } else {
      toast.info(`${action} — Feature coming soon`);
    }
  };

  const selected = emails.find(e => e.id === selectedEmail);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AccessibilityBar />
      <DecisionFatigueGuard />

      {/* Top Navigation */}
      <header className="border-b border-border/50 px-4 py-3 shrink-0">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/compass">
              <span className="flex items-center gap-2 text-foreground hover:text-revvel-gold transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/owlCKtVPVNjszaHN.png" alt="Revvel" className="w-7 h-7" />
                <span className="font-display text-lg">Revvel</span>
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <Link href="/compass">
              <Button variant="ghost" size="sm">
                <Compass className="w-4 h-4 mr-1.5" aria-hidden="true" />
                <span>Compass</span>
              </Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost" size="sm" className="text-revvel-gold">
                <InboxIcon className="w-4 h-4 mr-1.5" aria-hidden="true" />
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

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-revvel-forest/40 flex items-center justify-center text-xs font-bold text-revvel-green">
              {user?.name?.charAt(0) || "U"}
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()} aria-label="Sign out">
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {/* Inbox Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className={`${selectedEmail ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 lg:w-[420px] border-r border-border/50 shrink-0`}>
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-border/30 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
              <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search emails..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                aria-label="Search emails"
              />
            </div>
            <Button variant="ghost" size="sm" aria-label="Filter emails">
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span className="ml-1 hidden sm:inline">Filter</span>
            </Button>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto" role="list" aria-label="Email list">
            {emails.map((email, i) => (
              <motion.button
                key={email.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedEmail(email.id)}
                className={`w-full text-left p-4 border-b border-border/20 hover:bg-muted/30 transition-colors ${
                  selectedEmail === email.id ? "bg-muted/40 border-l-2 border-l-revvel-gold" : ""
                } ${!email.isRead ? "bg-muted/10" : ""}`}
                role="listitem"
                aria-label={`Email from ${email.from}: ${email.subject}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-revvel-forest/30 flex items-center justify-center text-xs font-bold text-revvel-green shrink-0 mt-0.5">
                    {email.from.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${!email.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {email.from}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">{email.time}</span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${!email.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{email.preview}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {email.isUrgent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-revvel-red/20 text-revvel-red">Urgent</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        <Tag className="w-2.5 h-2.5 inline mr-0.5" aria-hidden="true" />
                        {email.category}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Email Detail */}
        <div className={`${selectedEmail ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {selected ? (
            <div className="flex-1 flex flex-col">
              {/* Action Bar - Button-Label Pattern */}
              <div className="p-3 border-b border-border/30 flex items-center gap-1" role="toolbar" aria-label="Email actions">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedEmail(null)}>
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>Back</span>
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => handleAction("reply", selected.id)}>
                  <Reply className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>Reply</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction("star", selected.id)}>
                  <Star className={`w-4 h-4 mr-1 ${selected.isStarred ? "fill-revvel-gold text-revvel-gold" : ""}`} aria-hidden="true" />
                  <span>Star</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction("snooze", selected.id)}>
                  <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>Snooze</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction("archive", selected.id)}>
                  <Archive className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>Archive</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction("delete", selected.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>Delete</span>
                </Button>
              </div>

              {/* Email Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
                  <div>
                    <h2 className="font-display text-2xl text-foreground mb-4">{selected.subject}</h2>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-revvel-forest/30 flex items-center justify-center text-sm font-bold text-revvel-green">
                        {selected.from.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selected.from}</p>
                        <p className="text-xs text-muted-foreground">{selected.fromEmail} · {selected.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-sm text-foreground/90 leading-relaxed">
                    <p>{selected.preview}</p>
                    <p className="mt-4 text-muted-foreground italic">
                      Connect your Gmail account in Settings to see real email content here.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-3">
                <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto" aria-hidden="true" />
                <p className="text-muted-foreground">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
