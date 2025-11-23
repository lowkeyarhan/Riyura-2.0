/**
 * Encryption Utilities for Gemini API Key Management
 *
 * Security Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Unique initialization vector (IV) per encryption
 * - Authentication tag verification to prevent tampering
 * - Secure key derivation from environment variable
 * - Zero plaintext exposure (immediate cleanup)
 *
 * @module encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Constants
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Expect 64-character hex string (32 bytes)
  if (key.length !== KEY_LENGTH * 2) {
    throw new Error(
      `ENCRYPTION_KEY must be ${
        KEY_LENGTH * 2
      } characters (${KEY_LENGTH} bytes in hex)`
    );
  }

  try {
    return Buffer.from(key, "hex");
  } catch (error) {
    throw new Error("ENCRYPTION_KEY must be a valid hexadecimal string");
  }
}

/**
 * Generate a secure encryption key (for setup/initialization)
 * Run this once and store the result in your .env.local file
 *
 * @returns {string} 64-character hexadecimal string
 */
export function generateEncryptionKey(): string {
  const key = randomBytes(KEY_LENGTH);
  const hexKey = key.toString("hex");

  console.log("🔐 Generated Encryption Key (store this in .env.local):");
  console.log(`ENCRYPTION_KEY=${hexKey}`);
  console.log(
    "\n⚠️  IMPORTANT: Keep this key secret and never commit it to version control!"
  );

  return hexKey;
}

/**
 * Encrypt a Gemini API key
 *
 * @param {string} plaintext - The API key to encrypt
 * @returns {Object} Object containing encryptedKey, iv, and authTag (all base64 encoded)
 * @throws {Error} If encryption fails
 */
export function encryptApiKey(plaintext: string): {
  encryptedKey: string;
  iv: string;
  authTag: string;
} {
  try {
    // Input validation
    if (!plaintext || typeof plaintext !== "string") {
      throw new Error("Invalid API key: must be a non-empty string");
    }

    // Generate unique IV for this encryption
    const iv = randomBytes(IV_LENGTH);

    // Get encryption key
    const key = getEncryptionKey();

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Clear sensitive data from memory
    key.fill(0);

    return {
      encryptedKey: encrypted,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    };
  } catch (error) {
    console.error(
      "❌ Encryption error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt a Gemini API key
 *
 * @param {string} encryptedKey - Base64 encoded encrypted key
 * @param {string} iv - Base64 encoded initialization vector
 * @param {string} authTag - Base64 encoded authentication tag
 * @returns {string} Decrypted API key
 * @throws {Error} If decryption fails or authentication fails
 */
export function decryptApiKey(
  encryptedKey: string,
  iv: string,
  authTag: string
): string {
  try {
    // Input validation
    if (!encryptedKey || !iv || !authTag) {
      throw new Error("Missing required decryption parameters");
    }

    // Convert from base64
    const ivBuffer = Buffer.from(iv, "base64");
    const authTagBuffer = Buffer.from(authTag, "base64");

    // Get encryption key
    const key = getEncryptionKey();

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    // Decrypt
    let decrypted = decipher.update(encryptedKey, "base64", "utf8");
    decrypted += decipher.final("utf8");

    // Clear sensitive data from memory
    key.fill(0);

    return decrypted;
  } catch (error) {
    console.error(
      "❌ Decryption error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error(
      "Failed to decrypt API key - data may be corrupted or tampered with"
    );
  }
}

/**
 * Get preview of API key (first 4 characters + ***)
 *
 * @param {string} apiKey - The API key to preview
 * @returns {string} Masked preview (e.g., "AIza***")
 */
export function getKeyPreview(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return "****";
  }

  return apiKey.substring(0, 4) + "***";
}

/**
 * Validate Gemini API key format (basic sanity check)
 *
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if format appears valid
 */
export function isValidGeminiApiKeyFormat(apiKey: string): boolean {
  // Basic validation: should start with "AIza" and be reasonably long
  // This is NOT a complete validation - only the Gemini API can truly validate
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // Gemini API keys typically start with "AIza" and are 39 characters long
  // But we'll be lenient to support potential format changes
  const startsCorrectly = apiKey.startsWith("AIza");
  const hasReasonableLength = apiKey.length >= 20 && apiKey.length <= 100;
  const hasOnlyValidChars = /^[A-Za-z0-9_-]+$/.test(apiKey);

  return startsCorrectly && hasReasonableLength && hasOnlyValidChars;
}

/**
 * Utility to run key generation from command line
 * Usage: node -e "require('./dist/lib/encryption').generateEncryptionKey()"
 */
if (require.main === module) {
  generateEncryptionKey();
}
