import { EtherfuseClient } from './client';
import "dotenv/config";

const apiKey = process.env.ETHERFUSE_API_KEY;
const baseUrl = process.env.ETHERFUSE_API_URL || "https://api.sand.etherfuse.com";

if (!apiKey) {
  console.warn("[EtherfuseClient] ETHERFUSE_API_KEY não definida no .env");
}

export const etherfuseClient = new EtherfuseClient({
  apiKey: apiKey || "",
  baseUrl,
});

export * from './types';
export * from './etherfuseTypes';
export * from './client';
