/**
 * Admin Script: Encrypt Client Credentials
 * 
 * Run this BEFORE registering a client to encrypt their certificates locally.
 * Certificates should NEVER be sent in plain text.
 * 
 * Usage:
 *   npx tsx scripts/encrypt-client-credentials.ts
 * 
 * Output:
 *   encryptedCert: "iv:ciphertext"
 *   encryptedKey: "iv:ciphertext"  
 *   encryptedAccessToken: "iv:ciphertext"
 * 
 * Then use these values in registerClient call.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// Load master key from environment or .env file
const MASTER_KEY = process.env.ARCA_MASTER_KEY;

if (!MASTER_KEY) {
  console.error("❌ ERROR: ARCA_MASTER_KEY environment variable is required");
  console.error("   Run: export ARCA_MASTER_KEY=$(openssl rand -hex 32)");
  process.exit(1);
}

const KEY_BUFFER = Buffer.from(MASTER_KEY.padEnd(32).slice(0, 32), "utf8");

/**
 * Encrypts text using AES-256-CBC with the master key
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted = cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Main encryption function
 */
async function main() {
  console.log("\n🗝️  ARCA/AFIP Credential Encryption Script\n");
  console.log("═".repeat(50));

  // Load certificate files
  const certPath = path.join(__dirname, "../certs/client-cert.pem");
  const keyPath = path.join(__dirname, "../certs/client-key.pem");

  // Check if files exist
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error("❌ Certificate files not found");
    console.error(`   Expected: ${certPath}`);
    console.error(`   Expected: ${keyPath}`);
    console.error("\n📁 Place your certificates in ./certs/ directory:");
    console.error("   ./certs/client-cert.pem");
    console.error("   ./certs/client-key.pem");
    process.exit(1);
  }

  // Read files
  const cert = fs.readFileSync(certPath, "utf8").trim();
  const key = fs.readFileSync(keyPath, "utf8").trim();
  const accessToken = process.env.AFIP_ACCESS_TOKEN || "";

  if (!accessToken) {
    console.error("❌ AFIP_ACCESS_TOKEN environment variable is required");
    process.exit(1);
  }

  console.log("📄 Reading certificate files...");
  console.log(`   Certificate: ${certPath}`);
  console.log(`   Private Key: ${keyPath}`);

  // Encrypt
  console.log("\n🔐 Encrypting with master key...");
  const encryptedCert = encrypt(cert);
  const encryptedKey = encrypt(key);
  const encryptedAccessToken = encrypt(accessToken);

  // Output
  console.log("\n" + "═".repeat(50));
  console.log("✅ ENCRYPTED CREDENTIALS");
  console.log("═".repeat(50));
  console.log("\nCopy these values to register client:\n");

  console.log("encryptedCert:", encryptedCert);
  console.log("encryptedKey:", encryptedKey);
  console.log("encryptedAccessToken:", encryptedAccessToken);

  console.log("\n" + "═".repeat(50));
  console.log("📋 REGISTER CLIENT COMMAND:");
  console.log("═".repeat(50));
  console.log("\nRun this curl command:\n");

  const command = `curl -X POST http://localhost:5001/us-central1/registerClientHandler \\
  -H "Content-Type: application/json" \\
  -H "x-internal-key: \\${process.env.INTERNAL_AFIP_API_KEY || "$INTERNAL_KEY"} \\
  -d '{
    "razonSocial": "TU_RAZON_SOCIAL",
    "CUIT": "30123456789",
    "puntoVenta": 1,
    "condicionIva": "RESPONSABLE_INSCRIPTO",
    "encryptedCert": "${encryptedCert}",
    "encryptedKey": "${encryptedKey}",
    "encryptedAccessToken": "${encryptedAccessToken}"
  }'`;

  console.log(command);
  console.log("");

  // Save encrypted values to file for later use
  const outputPath = path.join(__dirname, "../.last-encrypted.json");
  fs.writeFileSync(outputPath, JSON.stringify({
    encryptedCert,
    encryptedKey,
    encryptedAccessToken,
    generatedAt: new Date().toISOString(),
  }, null, 2));

  console.log("💾 Values saved to: .last-encrypted.json");
  console.log("   (Delete this file after registering)");
  console.log("");
}

main().catch(console.error);