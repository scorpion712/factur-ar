import * as logger from "firebase-functions/logger";
import {decrypt, hashApiKey} from "./encryption.js";

export {DecryptionError} from "./errors.js";

export class AFIPAuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AFIPAuthError";
    this.code = code;
  }
}

export class ClientNotFoundError extends AFIPAuthError {
  constructor() {
    super("CLIENT_NOT_FOUND", "Client not registered");
  }
}

export class ClientInactiveError extends AFIPAuthError {
  constructor() {
    super("CLIENT_INACTIVE", "Client is deactivated");
  }
}

export class InvalidApiKeyError extends AFIPAuthError {
  constructor() {
    super("INVALID_API_KEY", "API key is invalid");
  }
}

export interface ClientConfig {
  clientId: string;
  apiKeyHash: string;
  active: boolean;
  encryptionKeyId: string;
  afip: {
    CUIT: string;
    razonSocial: string;
    puntoVenta: number;
    condicionIva: string;
    encryptedCert: string;
    encryptedKey: string;
    accessToken: string;
  };
}

export async function authenticateClient(
  clientId: string,
  apiKey: string,
  config: ClientConfig | null
): Promise<ClientConfig> {
  logger.info("Authenticating client", {clientId});

  if (!config) {
    logger.warn("Client not found", {clientId});
    throw new ClientNotFoundError();
  }

  if (!config.active) {
    logger.warn("Client is inactive", {clientId});
    throw new ClientInactiveError();
  }

  const apiKeyHash = hashApiKey(apiKey);

  if (apiKeyHash !== config.apiKeyHash) {
    logger.warn("Invalid API key", {clientId});
    throw new InvalidApiKeyError();
  }

  logger.info("Client authenticated successfully", {clientId});

  return config;
}

export function decryptClientCredentials(config: ClientConfig): {
  accessToken: string;
  cert: string;
  key: string;
  CUIT: string;
} {
  const cert = decrypt(config.afip.encryptedCert);
  const key = decrypt(config.afip.encryptedKey);
  const accessToken = decrypt(config.afip.accessToken);

  return {
    accessToken,
    cert,
    key,
    CUIT: config.afip.CUIT,
  };
}
