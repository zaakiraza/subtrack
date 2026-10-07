/**
 * Pages import named ops from here.
 * - No VITE_API_URL → in-memory mock (local / frontend-only deploy).
 * - VITE_API_URL set (factory Deploy FE+BE) → live Nest client.
 */
export * from "./mock/api";
