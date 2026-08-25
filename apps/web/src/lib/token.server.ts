import { createHash, randomBytes } from "node:crypto";

// 256 bits. The token is the whole secret, so unlike a six digit code it needs
// no keyed hash to survive a database dump being guessed at.
const TOKEN_BYTES = 32;

export const newToken = () => randomBytes(TOKEN_BYTES).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
