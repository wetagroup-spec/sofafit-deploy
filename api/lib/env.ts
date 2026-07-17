import "dotenv/config";

function optional(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  // Legacy template vars — not used by SofaFit, kept optional so the server
  // never crashes at startup when they are absent on the hosting platform.
  appId: optional("APP_ID"),
  appSecret: optional("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  // DB is optional at boot: the landing page must render even if the database
  // is temporarily unreachable. Order/chat features need it at query time.
  databaseUrl: optional("DATABASE_URL"),
};
