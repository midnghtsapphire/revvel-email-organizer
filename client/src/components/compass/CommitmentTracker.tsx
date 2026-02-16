import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, AlertTriangle, ListChecks } from "lucide-react";

interface Commitment {
  id: string;
  text: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  source: string;
}

interface CommitmentTrackerProps {
  commitments?: Commitment[];
}

const demoCommitments: Commitment[] = [
  { id: "1", text: "Send Q3 budget report to Audrey", dueDate: "Today", status: "pending", source: "Email from Audrey Evans" },
  { id: "2", text: "Review contract draft by EOD", dueDate: "Tomorrow", status: "pending", source: "Thread with Legal" },
  { id: "3", text: "Schedule team standup", dueDate: "Yesterday", status: "overdue", source: "Email from Jordan" },
  { id: "4", text: "Submit expense report", dueDate: "Feb 10", status: "completed", source: "Email from Finance" },
];

const statusConfig = {
  pending: { icon: Circle, color: "text-revvel-gold", bg: "bg-revvel-gold/10" },
  completed: { icon: CheckCircle2, color: "text-revvel-green", bg: "bg-revvel-green/10" },
  overdue: { icon: AlertTriangle, color: "text-revvel-red", bg: "bg-revvel-red/10" },
};

export default function CommitmentTracker({ commitments = demoCommitments }: CommitmentTrackerProps) {
  const pending = commitments.filter(c => c.status === "pending").length;
  const overdue = commitments.filter(c => c.status === "overdue").length;

  return (
    <div className="glass-card-hover p-6 space-y-4" role="region" aria-label="Commitment Tracker">
      <div className="flex items-center gap-3">
        <ListChecks className="w-8 h-8 text-revvel-gold" aria-hidden="true" />
        <div>
          <h3 className="font-display text-lg text-foreground">Commitment Tracker™</h3>
          <p className="text-xs text-muted-foreground">
            {pending} pending · {overdue > 0 && <span className="text-revvel-red">{overdue} overdue</span>}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {commitments.map((commitment, i) => {
          const config = statusConfig[commitment.status];
          const Icon = config.icon;
          return (
            <motion.div
              key={commitment.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} transition-colors`}
            >
              <Icon className={`w-4 h-4 mt-0.5 ${config.color} shrink-0`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${commitment.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {commitment.text}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span className={commitment.status === "overdue" ? "text-revvel-red font-medium" : ""}>
                    {commitment.dueDate}
                  </span>
                  <span className="text-border">·</span>
                  <span className="truncate">{commitment.source}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
