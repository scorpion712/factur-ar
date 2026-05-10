import crypto from "crypto";
import * as logger from "firebase-functions/logger";
import {hashApiKey} from "../services/encryption.js";
import {setClientConfig} from "../services/firestore.js";

export const RegisterClientRequestSchema = {
  razonSocial: (value: unknown) => {
    if (typeof value !== "string" || value.length < 1) {
      return {valid: false, error: "razonSocial is required"};
    }
    return {valid: true};
  },
  CUIT: (value: unknown) => {
    if (typeof value !== "string" || value.length !== 11) {
      return {valid: false, error: "CUIT must be 11 digits"};
    }
    return {valid: true};
  },
  puntoVenta: (value: unknown) => {
    if (typeof value !== "number" || value < 1 || value > 9999) {
      return {valid: false, error: "puntoVenta must be between 1 and 9999"};
    }
    return {valid: true};
  },
};

function generateClientId(): string {
  return `client_${crypto.randomBytes(8).toString("hex")}`;
}

function generateEncryptionKeyId(): string {
  return `key_${crypto.randomBytes(8).toString("hex")}`;
}

function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateRequest(data: {
  razonSocial?: unknown;
  CUIT?: unknown;
  puntoVenta?: unknown;
  condicionIva?: unknown;
  encryptedCert?: unknown;
  encryptedKey?: unknown;
  encryptedAccessToken?: unknown;
}): {valid: boolean; errors: string[]} {
  const errors: string[] = [];

  if (!RegisterClientRequestSchema.razonSocial(data.razonSocial).valid) {
    errors.push("razonSocial is required");
  }
  if (!RegisterClientRequestSchema.CUIT(data.CUIT).valid) { // eslint-disable-line new-cap
    errors.push("CUIT must be 11 digits");
  }
  if (!RegisterClientRequestSchema.puntoVenta(data.puntoVenta).valid) {
    errors.push("puntoVenta must be between 1 and 9999");
  }
  if (typeof data.condicionIva !== "string") {
    errors.push("condicionIva is required");
  }
  // Now expects ENCRYPTED values
  if (typeof data.encryptedCert !== "string" || data.encryptedCert.length < 1) {
    // eslint-disable-next-line max-len
    errors.push("encryptedCert is required (encrypt first using scripts/encrypt-client-credentials.ts)");
  }
  if (typeof data.encryptedKey !== "string" || data.encryptedKey.length < 1) {
    // eslint-disable-next-line max-len
    errors.push("encryptedKey is required (encrypt first using scripts/encrypt-client-credentials.ts)");
  }
  if (typeof data.encryptedAccessToken !== "string" || data.encryptedAccessToken.length < 1) {
    // eslint-disable-next-line max-len
    errors.push("encryptedAccessToken is required (encrypt first using scripts/encrypt-client-credentials.ts)");
  }

  return {valid: errors.length === 0, errors};
}

export async function registerClient(data: {
  razonSocial: string;
  CUIT: string;
  puntoVenta: number;
  condicionIva: string;
  encryptedCert: string;
  encryptedKey: string;
  encryptedAccessToken: string;
}): Promise<{
  success: boolean;
  data?: {clientId: string; apiKey: string; message: string};
  error?: {code: string; message: string};
}> {
  const validation = validateRequest(data);

  if (!validation.valid) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.errors.join(", "),
      },
    };
  }

  const {
    razonSocial,
    CUIT,
    puntoVenta,
    condicionIva,
    encryptedCert,
    encryptedKey,
    encryptedAccessToken,
  } = data;

  logger.info("Registering new client", {CUIT, razonSocial});

  const clientId = generateClientId();
  const apiKey = generateApiKey();
  const encryptionKeyId = generateEncryptionKeyId();
  const apiKeyHash = hashApiKey(apiKey);

  // Store ENCRYPTED credentials directly
  // They were already encrypted by admin before sending
  const clientData = {
    apiKeyHash,
    active: true,
    encryptionKeyId,
    afip: {
      CUIT,
      razonSocial,
      puntoVenta,
      condicionIva,
      encryptedCert, // Already encrypted by admin
      encryptedKey, // Already encrypted by admin
      accessToken: encryptedAccessToken, // Already encrypted by admin
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setClientConfig(clientId, clientData);

  logger.info("Client registered successfully", {clientId, CUIT});

  return {
    success: true,
    data: {
      clientId,
      apiKey,
      message: "Client registered. Save apiKey - it won't be shown again.",
    },
  };
}
