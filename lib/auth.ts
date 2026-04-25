import { buildAppApiUrl, USE_MOCK_DATA } from "./api-config"
import { getMockLoginResult } from "./mock-data"

const USER_SESSION_STORAGE_KEY = "lensscore.user-session"
const AUTH_TOKEN_STORAGE_KEY = "lensscore.auth-token"

export interface UserSession {
  foto_perfil: string | null
  id: number
  nome: string
  email: string
  cards: string | null
  unidades: Array<{ id: number; nome: string }>
  expira_senha: number | null
  B2BouInstrutor: number | null
}

interface LoginResponse {
  token: string
}

function isEmailLogin(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function login(identifier: string, password: string): Promise<UserSession> {
  const credentials = identifier.trim()

  if (USE_MOCK_DATA) {
    const mockLogin = getMockLoginResult(credentials, password)

    if (!mockLogin) {
      throw new Error("Credenciais inválidas. Use um dos acessos de teste configurados.")
    }

    localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(mockLogin.userSession))
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, mockLogin.token)

    return mockLogin.userSession
  }

  const loginPayload = isEmailLogin(credentials)
    ? { email: credentials, password }
    : { usuario: credentials, password }

  const loginRes = await fetch(buildAppApiUrl("/api/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginPayload),
  })

  if (!loginRes.ok) {
    if (loginRes.status === 401) {
      throw new Error("Credenciais inválidas. Verifique seu usuário e senha.")
    }
    throw new Error("Erro ao conectar com o servidor. Tente novamente.")
  }

  const loginData: LoginResponse = await loginRes.json()
  const token = loginData.token

  if (!token) {
    throw new Error("Resposta inesperada do servidor.")
  }

  const userRes = await fetch(buildAppApiUrl("/api/v1/getUser"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!userRes.ok) {
    throw new Error("Não foi possível obter os dados do usuário.")
  }

  const userSession: UserSession = await userRes.json()

  localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(userSession))
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)

  return userSession
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserSession
  } catch {
    return null
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function isCameraRestricted(session: UserSession | null | undefined): boolean {
  return session?.B2BouInstrutor === 104
}

export function logout() {
  localStorage.removeItem(USER_SESSION_STORAGE_KEY)
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  window.location.href = "/login"
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getSession()
}
