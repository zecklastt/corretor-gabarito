function normalizeBaseUrl(value?: string): string {
  return value?.trim().replace(/\/+$/, "") ?? ""
}

const APP_API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)
const SCAN_API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_SCAN_API_BASE_URL)

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

export function buildAppApiUrl(path: string): string {
  if (!APP_API_BASE_URL) {
    throw new Error("Configure NEXT_PUBLIC_API_BASE_URL antes de usar o LensScore.")
  }

  return `${APP_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function buildScanApiUrl(path: string): string {
  if (!SCAN_API_BASE_URL) {
    throw new Error("Configure NEXT_PUBLIC_SCAN_API_BASE_URL antes de usar o scanner do LensScore.")
  }

  return `${SCAN_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}