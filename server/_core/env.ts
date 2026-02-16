export const ENV = {
  appId: process.env.VITE_APP_ID ?? "revvel-email-organizer",
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // OpenRouter AI
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
};
