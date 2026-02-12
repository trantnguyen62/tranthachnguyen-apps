import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'development-secret-change-in-production');

export interface JWTPayload {
  userId: string;
  sessionId?: string;
  [key: string]: unknown;
}

export function signToken(payload: JWTPayload, expiresIn: string = "7d"): string {
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
