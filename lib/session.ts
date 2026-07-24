import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-secret-change-me");
const COOKIE_NAME = "tradeix_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    // Expired or tampered token — caller treats this exactly like "logged out",
    // never as an error state. Auth failures degrade to "please log in".
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
