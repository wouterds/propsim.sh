import { createHash, randomBytes } from "node:crypto";

// 256 bits, so a plain hash is enough. A six digit code needs the keyed one.
const TOKEN_BYTES = 32;

export const newToken = () => randomBytes(TOKEN_BYTES).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
