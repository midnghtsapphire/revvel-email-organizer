import { motion } from "framer-motion";
import { Users, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  name: string;
  email: string;
  lastContacted: string;
  daysSince: number;
  relationshipScore: number;
}

interface RelationalSonarProps {
  contacts?: Contact[];
}

const demoContacts: Contact[] = [
  { id: "1", name: "Audrey Evans", email: "audrey@example.com", lastContacted: "3 weeks ago", daysSince: 21, relationshipScore: 85 },
  { id: "2", name: "Jordan Mitchell", email: "jordan@example.com", lastContacted: "5 days ago", daysSince: 5, relationshipScore: 92 },
  { id: "3", name: "Sam Chen", email: "sam@example.com", lastContacted: "2 months ago", daysSince: 60, relationshipScore: 45 },
];

function getUrgencyColor(days: number): string {
  if (days > 30) return "text-revvel-red";
  if (days > 14) return "text-revvel-amber";
  return "text-revvel-green";
}

function getScoreBar(score: number): string {
  if (score > 75) return "bg-revvel-green";
  if (score > 50) return "bg-revvel-gold";
  return "bg-revvel-red";
}

export default function RelationalSonar({ contacts = demoContacts }: RelationalSonarProps) {
  const needsAttention = contacts.filter(c => c.daysSince > 14);

  return (
    <div className="glass-card-hover p-6 space-y-4" role="region" aria-label="Relational Sonar">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-revvel-gold" aria-hidden="true" />
        <div>
          <h3 className="font-display text-lg text-foreground">Relational Sonar™</h3>
          <p className="text-xs text-muted-foreground">
            {needsAttention.length} connection{needsAttention.length !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {contacts.slice(0, 3).map((contact, i) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-background/60 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "oklch(0.3 0.06 145 / 40%)", color: "oklch(0.8 0.08 145)" }}
              aria-hidden="true"
            >
              {contact.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span className={getUrgencyColor(contact.daysSince)}>{contact.lastContacted}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden" aria-label={`Relationship score: ${contact.relationshipScore}%`}>
                <div className={`h-full rounded-full ${getScoreBar(contact.relationshipScore)}`} style={{ width: `${contact.relationshipScore}%` }} />
              </div>
              {contact.daysSince > 14 && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-revvel-gold hover:text-revvel-gold">
                  <span>Reconnect</span>
                  <ArrowRight className="w-3 h-3 ml-1" aria-hidden="true" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
