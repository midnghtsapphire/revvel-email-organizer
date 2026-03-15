import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AccessibilityBar from "@/components/AccessibilityBar";
import DecisionFatigueGuard from "@/components/DecisionFatigueGuard";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Star, Archive, Clock, Reply, Trash2, Search, Filter,
  Compass, Settings, Inbox as InboxIcon, ChevronLeft, LogOut,
  Tag, RefreshCw, Sparkles, CheckSquare, Square, Loader2,
  FolderOpen, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface DemoEmail {
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

const DEMO_EMAILS: DemoEmail[] = [
  { id: "1", from: "Audrey Evans", fromEmail: "audrey@example.com", subject: "Q3 Budget Review — Action Required", preview: "Hi, I wanted to follow up on the Q3 budget report we discussed last week. Could you send me the updated figures by...", time: "10:23 AM", isRead: false, isStarred: true, category: "Work", isUrgent: true },
  { id: "2", from: "Jordan Mitchell", fromEmail: "jordan@example.com", subject: "Team Standup Notes", preview: "Here are the notes from today's standup. Key action items: 1) Finalize the API integration, 2) Review the...", time: "9:45 AM", isRead: false, isStarred: false, category: "Work", isUrgent: false },
  { id: "3", from: "GitHub", fromEmail: "noreply@github.com", subject: "[revvel-email-organizer] PR #42 merged", preview: "Pull request #42 has been merged into main. Changes include the new Compass Dashboard components and...", time: "Yesterday", isRead: true, isStarred: false, category: "Notifications", isUrgent: false },
  { id: "4", from: "Sam Chen", fromEmail: "sam@example.com", subject: "Re: Project Timeline Update", preview: "Thanks for the update. I think we should push the deadline back by a week to ensure quality. What do you...", time: "Yesterday", isRead: true, isStarred: false, category: "Work", isUrgent: false },
  { id: "5", from: "Stripe", fromEmail: "receipts@stripe.com", subject: "Your receipt from Revvel Pro", preview: "Thank you for your subscription to Revvel Pro. Your monthly charge of $15.00 has been processed...", time: "Feb 14", isRead: true, isStarred: false, category: "Receipts", isUrgent: false },
  { id: "6", from: "Newsletter Weekly", fromEmail: "digest@newsletter.com", subject: "This Week in Tech: AI Email Revolution", preview: "The future of email is here. New AI-powered tools are transforming how we manage our inboxes...", time: "Feb 13", isRead: true, isStarred: false, category: "Newsletters", isUrgent: false },
];

const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-amber-900/30 text-amber-200",
  Personal: "bg-green-900/30 text-green-200",
  Newsletters: "bg-yellow-900/30 text-yellow-200",
  Notifications: "bg-slate-700/30 text-slate-200",
  Receipts: "bg-blue-900/30 text-blue-200",
  Social: "bg-purple-900/30 text-purple-200",
  Promotions: "bg-orange-900/30 text-orange-200",
  Finance: "bg-emerald-900/30 text-emerald-200",
  Travel: "bg-cyan-900/30 text-cyan-200",
  Health: "bg-lime-900/30 text-lime-200",
};

export default function Inbox() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { incrementDecisions } = useAccessibility();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demoEmails, setDemoEmails] = useState(DEMO_EMAILS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [showOrganizePanel, setShowOrganizePanel] = useState(false);

  const { data: gmailAccounts } = trpc.gmail.listAccounts.useQuery(undefined, { enabled: isAuthenticated });
  const primaryAccount = gmailAccounts?.[0];
  const isGmailConnected = !!primaryAccount;

  const { data: syncedEmails, refetch: refetchEmails } = trpc.emails.list.useQuery(
    { gmailAccountId: primaryAccount?.id, category: filterCategory ?? undefined, isArchived: false, limit: 100 },
    { enabled: isAuthenticated && isGmailConnected }
  );

  const { data: categoryCounts } = trpc.emails.categoryCounts.useQuery(undefined, { enabled: isAuthenticated && isGmailConnected });

  const { data: activeJob } = trpc.emails.jobStatus.useQuery(
    { jobId: activeJobId! },
    {
      enabled: !!activeJobId,
      refetchInterval: (query) => {
        const d = query.state.data;
        if (!d) return false;
        const st = (d as { status: string }).status;
        return st === "running" || st === "queued" ? 2000 : false;
      },
    }
  );

  const syncMutation = trpc.emails.sync.useMutation({
    onSuccess: (data) => { toast.success(`Synced ${data.synced} emails`); refetchEmails(); },
    onError: (err) => toast.error(`Sync failed: ${err.message}`),
  });

  const organizeAllMutation = trpc.emails.organizeAll.useMutation({
    onSuccess: (data) => { setActiveJobId(data.jobId); toast.success("Organizing inbox…"); },
    onError: (err) => toast.error(`Organize failed: ${err.message}`),
  });

  const bulkActionMutation = trpc.emails.bulkAction.useMutation({
    onSuccess: (data) => { toast.success(`${data.affected} emails updated`); setSelectedIds(new Set()); refetchEmails(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSync = useCallback(() => {
    if (!primaryAccount) return;
    incrementDecisions();
    syncMutation.mutate({ accountId: primaryAccount.id, maxResults: 100 });
  }, [primaryAccount, syncMutation, incrementDecisions]);

  const handleOrganizeAll = useCallback(() => {
    if (!primaryAccount) return;
    incrementDecisions();
    organizeAllMutation.mutate({ accountId: primaryAccount.id });
  }, [primaryAccount, organizeAllMutation, incrementDecisions]);

  const handleBulkAction = useCallback((action: "archive" | "trash" | "markRead" | "markUnread" | "star") => {
    if (!primaryAccount || selectedIds.size === 0) return;
    incrementDecisions();
    bulkActionMutation.mutate({ accountId: primaryAccount.id, messageIds: Array.from(selectedIds), action });
  }, [primaryAccount, selectedIds, bulkActionMutation, incrementDecisions]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleDemoAction = (action: string, emailId: string) => {
    incrementDecisions();
    if (action === "archive") { setDemoEmails(prev => prev.filter(e => e.id !== emailId)); toast.success("Email archived"); }
    else if (action === "star") { setDemoEmails(prev => prev.map(e => e.id === emailId ? { ...e, isStarred: !e.isStarred } : e)); }
    else if (action === "delete") { setDemoEmails(prev => prev.filter(e => e.id !== emailId)); toast.success("Email deleted"); }
    else { toast.info(`${action} coming soon`); }
  };

  const realEmails = syncedEmails ?? [];
  const filteredReal = realEmails.filter(e => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (e.subject ?? "").toLowerCase().includes(q) || (e.fromName ?? "").toLowerCase().includes(q) || (e.snippet ?? "").toLowerCase().includes(q);
    }
    return true;
  });
  const filteredDemo = demoEmails.filter(e => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (searchQuery) { const q = searchQuery.toLowerCase(); return e.subject.toLowerCase().includes(q) || e.from.toLowerCase().includes(q); }
    return true;
  });
  const selectedRealEmail = realEmails.find(e => e.messageId === selectedId);
  const selectedDemoEmail = demoEmails.find(e => e.id === selectedId);
  const organizeProgress = activeJob ? Math.round((activeJob.processed / Math.max(activeJob.total, 1)) * 100) : 0;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AccessibilityBar />
      <DecisionFatigueGuard />

      <header className="border-b border-border/50 px-4 py-3 shrink-0">
        <div className="container flex items-center justify-between">
          <Link href="/compass">
            <span className="flex items-center gap-2 text-foreground hover:text-revvel-gold transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/owlCKtVPVNjszaHN.png" alt="Revvel" className="w-7 h-7" />
              <span className="font-display text-lg">Revvel</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <Link href="/compass"><Button variant="ghost" size="sm"><Compass className="w-4 h-4 mr-1.5" aria-hidden="true" /><span>Compass</span></Button></Link>
            <Link href="/inbox"><Button variant="ghost" size="sm" className="text-revvel-gold"><InboxIcon className="w-4 h-4 mr-1.5" aria-hidden="true" /><span>Inbox</span></Button></Link>
            <Link href="/settings"><Button variant="ghost" size="sm"><Settings className="w-4 h-4 mr-1.5" aria-hidden="true" /><span>Settings</span></Button></Link>
          </nav>
          <div className="flex items-center gap-2">
            {isGmailConnected && (
              <>
                <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncMutation.isPending} aria-label="Sync emails">
                  {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />}
                  <span className="ml-1 hidden sm:inline">Sync</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowOrganizePanel(p => !p)} aria-label="Organize inbox">
                  <Sparkles className="w-4 h-4 mr-1" aria-hidden="true" /><span className="hidden sm:inline">Organize</span>
                </Button>
              </>
            )}
            <div className="w-7 h-7 rounded-full bg-revvel-forest/40 flex items-center justify-center text-xs font-bold text-revvel-green">{user?.name?.charAt(0) || "U"}</div>
            <Button variant="ghost" size="sm" onClick={() => logout()} aria-label="Sign out"><LogOut className="w-4 h-4" aria-hidden="true" /></Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showOrganizePanel && isGmailConnected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border/50 overflow-hidden">
            <div className="container py-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-revvel-gold" aria-hidden="true" />Smart Inbox Organizer
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Auto-categorize and apply Revvel/* labels to all emails. Handles 300 000+ emails in batches of 1 000.
                  </p>
                </div>
                <Button onClick={handleOrganizeAll} disabled={organizeAllMutation.isPending || activeJob?.status === "running"} className="bg-revvel-gold/20 hover:bg-revvel-gold/30 text-revvel-gold border border-revvel-gold/40">
                  {organizeAllMutation.isPending || activeJob?.status === "running"
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />Running…</>
                    : <><Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />Organize All</>}
                </Button>
              </div>
              {activeJob && (activeJob.status === "running" || activeJob.status === "completed" || activeJob.status === "failed") && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{activeJob.status === "completed" ? "Complete!" : activeJob.status === "failed" ? `Failed: ${activeJob.errorMessage}` : `Processing… ${activeJob.processed.toLocaleString()} emails`}</span>
                    <span>{organizeProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-revvel-gold rounded-full" initial={{ width: 0 }} animate={{ width: `${organizeProgress}%` }} />
                  </div>
                  {activeJob.categoryCounts && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(activeJob.categoryCounts as Record<string, number>).map(([cat, count]) => (
                        <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground"}`}>{cat}: {(count as number).toLocaleString()}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {categoryCounts && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterCategory(null)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${!filterCategory ? "border-revvel-gold bg-revvel-gold/20 text-revvel-gold" : "border-border text-muted-foreground hover:border-border/80"}`}>
                    All ({Object.values(categoryCounts.categories).reduce((s, n) => s + n, 0)})
                  </button>
                  {Object.entries(categoryCounts.categories).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <button key={cat} onClick={() => setFilterCategory(cat === filterCategory ? null : cat)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterCategory === cat ? "border-revvel-gold bg-revvel-gold/20 text-revvel-gold" : "border-border text-muted-foreground hover:border-border/80"}`}>
                      {cat} ({count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIds.size > 0 && isGmailConnected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-revvel-gold/30 bg-revvel-gold/5 overflow-hidden">
            <div className="container py-2 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-revvel-gold">{selectedIds.size} selected</span>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("archive")} disabled={bulkActionMutation.isPending}><Archive className="w-3.5 h-3.5 mr-1" aria-hidden="true" /><span>Archive</span></Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("markRead")} disabled={bulkActionMutation.isPending}><Mail className="w-3.5 h-3.5 mr-1" aria-hidden="true" /><span>Mark read</span></Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("star")} disabled={bulkActionMutation.isPending}><Star className="w-3.5 h-3.5 mr-1" aria-hidden="true" /><span>Star</span></Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("trash")} className="text-destructive" disabled={bulkActionMutation.isPending}><Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" /><span>Trash</span></Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="ml-auto text-muted-foreground">Clear</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isGmailConnected && (
        <div className="bg-muted/20 border-b border-border/30 px-4 py-2">
          <div className="container flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Showing demo emails. <Link href="/settings"><span className="text-revvel-gold underline cursor-pointer">Connect your Gmail account</span></Link> to organize your real inbox.</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 lg:w-[420px] border-r border-border/50 shrink-0`}>
          <div className="p-3 border-b border-border/30 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
              <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search emails…" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" aria-label="Search emails" />
            </div>
            {isGmailConnected && (
              <Button variant="ghost" size="sm" onClick={() => setShowOrganizePanel(p => !p)} aria-label="Toggle filter">
                <Filter className="w-4 h-4" aria-hidden="true" />
                {filterCategory && <span className="ml-1 text-revvel-gold text-xs">{filterCategory}</span>}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto" role="list" aria-label="Email list">
            {isGmailConnected ? (
              filteredReal.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                  <FolderOpen className="w-8 h-8 opacity-30" aria-hidden="true" />
                  <span>No emails found.</span>
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
                    {syncMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Syncing…</> : <><RefreshCw className="w-4 h-4 mr-1" />Sync inbox</>}
                  </Button>
                </div>
              ) : filteredReal.map((email) => (
                <div key={email.messageId} className={`w-full text-left p-4 border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer ${selectedId === email.messageId ? "bg-muted/40 border-l-2 border-l-revvel-gold" : ""} ${!email.isRead ? "bg-muted/10" : ""}`} role="listitem">
                  <div className="flex items-start gap-3">
                    <button className="mt-1 shrink-0" onClick={e => { e.stopPropagation(); toggleSelect(email.messageId); }} aria-label={selectedIds.has(email.messageId) ? "Deselect" : "Select"}>
                      {selectedIds.has(email.messageId) ? <CheckSquare className="w-4 h-4 text-revvel-gold" aria-hidden="true" /> : <Square className="w-4 h-4 text-muted-foreground/30" aria-hidden="true" />}
                    </button>
                    <button className="flex-1 text-left" onClick={() => setSelectedId(email.messageId)}>
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-revvel-forest/30 flex items-center justify-center text-xs font-bold text-revvel-green shrink-0 mt-0.5">
                          {(email.fromName ?? email.fromEmail ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!email.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{email.fromName ?? email.fromEmail}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{email.receivedAt ? new Date(email.receivedAt).toLocaleDateString() : ""}</span>
                          </div>
                          <p className={`text-sm truncate mt-0.5 ${!email.isRead ? "text-foreground" : "text-muted-foreground"}`}>{email.subject}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{email.snippet}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {email.priority === "high" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-revvel-red/20 text-revvel-red">Urgent</span>}
                            {email.category && <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[email.category] ?? "bg-muted text-muted-foreground"}`}><Tag className="w-2.5 h-2.5 inline mr-0.5" aria-hidden="true" />{email.category}</span>}
                            {email.isStarred && <Star className="w-3 h-3 fill-revvel-gold text-revvel-gold" aria-hidden="true" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              filteredDemo.map((email, i) => (
                <motion.button key={email.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} onClick={() => setSelectedId(email.id)} className={`w-full text-left p-4 border-b border-border/20 hover:bg-muted/30 transition-colors ${selectedId === email.id ? "bg-muted/40 border-l-2 border-l-revvel-gold" : ""} ${!email.isRead ? "bg-muted/10" : ""}`} role="listitem">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-revvel-forest/30 flex items-center justify-center text-xs font-bold text-revvel-green shrink-0 mt-0.5">{email.from.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${!email.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{email.from}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{email.time}</span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${!email.isRead ? "text-foreground" : "text-muted-foreground"}`}>{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{email.preview}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {email.isUrgent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-revvel-red/20 text-revvel-red">Urgent</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[email.category] ?? "bg-muted text-muted-foreground"}`}><Tag className="w-2.5 h-2.5 inline mr-0.5" aria-hidden="true" />{email.category}</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        <div className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {(isGmailConnected ? selectedRealEmail : selectedDemoEmail) ? (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-border/30 flex items-center gap-1" role="toolbar" aria-label="Email actions">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedId(null)}><ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" /><span>Back</span></Button>
                <div className="flex-1" />
                {isGmailConnected && selectedRealEmail ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => bulkActionMutation.mutate({ accountId: primaryAccount!.id, messageIds: [selectedRealEmail.messageId], action: "star" })}><Star className={`w-4 h-4 mr-1 ${selectedRealEmail.isStarred ? "fill-revvel-gold text-revvel-gold" : ""}`} aria-hidden="true" /><span>Star</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => { bulkActionMutation.mutate({ accountId: primaryAccount!.id, messageIds: [selectedRealEmail.messageId], action: "archive" }); setSelectedId(null); }}><Archive className="w-4 h-4 mr-1" aria-hidden="true" /><span>Archive</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => { bulkActionMutation.mutate({ accountId: primaryAccount!.id, messageIds: [selectedRealEmail.messageId], action: "trash" }); setSelectedId(null); }} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" aria-hidden="true" /><span>Trash</span></Button>
                  </>
                ) : selectedDemoEmail ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleDemoAction("reply", selectedDemoEmail.id)}><Reply className="w-4 h-4 mr-1" aria-hidden="true" /><span>Reply</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDemoAction("star", selectedDemoEmail.id)}><Star className={`w-4 h-4 mr-1 ${selectedDemoEmail.isStarred ? "fill-revvel-gold text-revvel-gold" : ""}`} aria-hidden="true" /><span>Star</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDemoAction("snooze", selectedDemoEmail.id)}><Clock className="w-4 h-4 mr-1" aria-hidden="true" /><span>Snooze</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => { handleDemoAction("archive", selectedDemoEmail.id); setSelectedId(null); }}><Archive className="w-4 h-4 mr-1" aria-hidden="true" /><span>Archive</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => { handleDemoAction("delete", selectedDemoEmail.id); setSelectedId(null); }} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" aria-hidden="true" /><span>Delete</span></Button>
                  </>
                ) : null}
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
                  {isGmailConnected && selectedRealEmail ? (
                    <>
                      <div>
                        <h2 className="font-display text-2xl text-foreground mb-4">{selectedRealEmail.subject}</h2>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-revvel-forest/30 flex items-center justify-center text-sm font-bold text-revvel-green">{(selectedRealEmail.fromName ?? selectedRealEmail.fromEmail ?? "?").charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedRealEmail.fromName ?? selectedRealEmail.fromEmail}</p>
                            <p className="text-xs text-muted-foreground">{selectedRealEmail.fromEmail} · {selectedRealEmail.receivedAt ? new Date(selectedRealEmail.receivedAt).toLocaleString() : ""}</p>
                          </div>
                          {selectedRealEmail.category && <Badge className={`${CATEGORY_COLORS[selectedRealEmail.category] ?? ""} border-0`}>{selectedRealEmail.category}</Badge>}
                        </div>
                      </div>
                      <div className="prose prose-sm text-foreground/90 leading-relaxed">
                        <p>{selectedRealEmail.snippet}</p>
                        <p className="mt-4 text-muted-foreground italic text-sm">Full email body will be shown here once the read scope is granted in Settings.</p>
                      </div>
                    </>
                  ) : selectedDemoEmail ? (
                    <>
                      <div>
                        <h2 className="font-display text-2xl text-foreground mb-4">{selectedDemoEmail.subject}</h2>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-revvel-forest/30 flex items-center justify-center text-sm font-bold text-revvel-green">{selectedDemoEmail.from.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedDemoEmail.from}</p>
                            <p className="text-xs text-muted-foreground">{selectedDemoEmail.fromEmail} · {selectedDemoEmail.time}</p>
                          </div>
                        </div>
                      </div>
                      <div className="prose prose-sm text-foreground/90 leading-relaxed">
                        <p>{selectedDemoEmail.preview}</p>
                        <p className="mt-4 text-muted-foreground italic">Connect your Gmail account in Settings to see real email content here.</p>
                      </div>
                    </>
                  ) : null}
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
