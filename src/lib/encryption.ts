import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Gets the encryption key from environment variables.
 * Throws an error if the key is missing or invalid.
 */
const getEnvKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "❌ Invalid ENCRYPTION_KEY: Must be a 64-character hex string."
    );
  }
  return Buffer.from(key, "hex");
};

/**
 * Generates a new random encryption key.
 * Use this once to generate a key for your .env file.
 */
export const generateEncryptionKey = (): string => {
  const key = randomBytes(32).toString("hex");
  console.log(`🔐 Generated Key: ENCRYPTION_KEY=${key}`);
  return key;
};

/**
 * Encrypts a string using AES-256-GCM.
 */
export const encryptApiKey = (text: string) => {
  if (!text) throw new Error("Cannot encrypt empty string");

  const key = getEnvKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    encryptedKey: encrypted,
    iv: iv.toString("base64"),
    authTag,
  };
};

/**
 * Decrypts a string using AES-256-GCM.
 */
export const decryptApiKey = (
  encrypted: string,
  iv: string,
  authTag: string
) => {
  const key = getEnvKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Returns a masked preview of the API key (e.g., "AIza***").
 */
export const getKeyPreview = (key: string) => {
  if (!key || key.length < 4) return "****";
  return `${key.slice(0, 4)}***`;
};

/**
 * Basic validation for Gemini API keys.
 * Checks if it starts with "AIza" and has a reasonable length.
 */
export const isValidGeminiApiKeyFormat = (key: string) => {
  return (
    !!key && key.startsWith("AIza") && key.length >= 20 && key.length <= 100
  );
};
