import { ApiClient } from "./client";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
export const CATALOG_REVALIDATE_SECONDS = 120;

export function createBackendClient(token?: string) {
  return new ApiClient({
    baseUrl: API_URL,
    getToken: token ? () => token : undefined,
  });
}

export const catalogApi = createBackendClient();
