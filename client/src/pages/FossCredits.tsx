import AccessibilityBar from "@/components/AccessibilityBar";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Heart } from "lucide-react";
import { Link } from "wouter";

const fossProjects = [
  { name: "React", description: "UI component library powering the Revvel frontend.", url: "https://react.dev", license: "MIT" },
  { name: "TypeScript", description: "Type-safe JavaScript for reliable, maintainable code.", url: "https://www.typescriptlang.org", license: "Apache-2.0" },
  { name: "Tailwind CSS", description: "Utility-first CSS framework for the earthy dark theme.", url: "https://tailwindcss.com", license: "MIT" },
  { name: "Express.js", description: "Fast, unopinionated web framework for the API server.", url: "https://expressjs.com", license: "MIT" },
  { name: "tRPC", description: "End-to-end typesafe APIs connecting frontend and backend.", url: "https://trpc.io", license: "MIT" },
  { name: "Drizzle ORM", description: "TypeScript ORM for database schema and queries.", url: "https://orm.drizzle.team", license: "Apache-2.0" },
  { name: "Framer Motion", description: "Production-ready animations for purposeful movement.", url: "https://www.framer.com/motion", license: "MIT" },
  { name: "Lucide React", description: "Beautiful, consistent icon set with text labels.", url: "https://lucide.dev", license: "ISC" },
  { name: "Radix UI", description: "Accessible, unstyled UI primitives for shadcn/ui.", url: "https://www.radix-ui.com", license: "MIT" },
  { name: "shadcn/ui", description: "Re-usable UI components built on Radix and Tailwind.", url: "https://ui.shadcn.com", license: "MIT" },
  { name: "Recharts", description: "Composable charting library for email analytics.", url: "https://recharts.org", license: "MIT" },
  { name: "Zod", description: "TypeScript-first schema validation for API inputs.", url: "https://zod.dev", license: "MIT" },
  { name: "Vite", description: "Next-generation frontend build tool for fast development.", url: "https://vitejs.dev", license: "MIT" },
  { name: "Vitest", description: "Blazing fast unit test framework powered by Vite.", url: "https://vitest.dev", license: "MIT" },
  { name: "OpenDyslexic", description: "Open-source typeface designed for readability with dyslexia.", url: "https://opendyslexic.org", license: "SIL OFL" },
  { name: "Sonner", description: "Opinionated toast notification component.", url: "https://sonner.emilkowal.ski", license: "MIT" },
  { name: "Wouter", description: "Minimalist routing library for React applications.", url: "https://github.com/molefrog/wouter", license: "ISC" },
  { name: "date-fns", description: "Modern JavaScript date utility library.", url: "https://date-fns.org", license: "MIT" },
  { name: "Docker", description: "Containerization platform for consistent deployments.", url: "https://www.docker.com", license: "Apache-2.0" },
  { name: "PostgreSQL", description: "Advanced open-source relational database.", url: "https://www.postgresql.org", license: "PostgreSQL" },
];

export default function FossCredits() {
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

      <main className="container py-16 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-8 h-8 text-revvel-red" aria-hidden="true" />
          </div>
          <h1 className="font-display text-4xl text-foreground">
            FOSS Credits
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Revvel is built on the shoulders of incredible open-source projects. We are grateful to every contributor who makes this possible.
          </p>
        </motion.div>

        <div className="space-y-3">
          {fossProjects.map((project, i) => (
            <motion.a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 glass-card-hover group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground group-hover:text-revvel-gold transition-colors">
                    {project.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {project.license}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-revvel-gold shrink-0 transition-colors" aria-hidden="true" />
            </motion.a>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>AI features powered by free and open-source APIs via OpenRouter.</p>
          <p className="mt-1">Email integration provided by Gmail API (Google).</p>
          <p className="mt-1">Payment processing provided by Stripe.</p>
        </div>
      </main>
    </div>
  );
}
