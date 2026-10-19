import { auth as realAuth } from "@/auth";
import type { Session } from "next-auth";

const DEV_SESSION: Session = {
  user: {
    id: "dev-preview-user",
    name: "Dev Preview",
    email: "dev@viare.local",
    image: null,
    role: "STUDENT",
  },
  expires: new Date(Date.now() + 86400000 * 30).toISOString(),
};

export async function auth(): Promise<Session | null> {
  // Nunca em produção: SKIP_AUTH esquecido num deploy abriria a conta para qualquer um.
  if (process.env.SKIP_AUTH === "true" && process.env.NODE_ENV !== "production") {
    return DEV_SESSION;
  }
  return realAuth();
}
