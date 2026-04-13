/**
 * config.ts
 *
 * Centralized configuration for the frontend application.
 * Utilizes environment variables injected by Next.js/Vercel.
 */

// Fallback to localhost for local development if the env var is not set.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
