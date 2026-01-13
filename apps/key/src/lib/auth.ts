const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001/api/v1/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  workspace_id: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  organization_name?: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

class AuthService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AuthError(
        error.error?.message || 'Authentication failed',
        error.error?.code || 'AUTH_ERROR'
      );
    }

    return response.json();
  }

  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{
      data: { user: User; access_token: string; refresh_token: string; expires_at: number };
    }>('/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const { user, access_token, refresh_token, expires_at } = response.data;
    const tokens = { access_token, refresh_token, expires_at };

    // Store tokens
    this.setTokens(tokens);

    return { user, tokens };
  }

  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{
      data: { user: User; access_token: string; refresh_token: string; expires_at: number };
    }>('/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const { user, access_token, refresh_token, expires_at } = response.data;
    const tokens = { access_token, refresh_token, expires_at };

    this.setTokens(tokens);

    return { user, tokens };
  }

  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        await this.request('/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } finally {
      this.clearTokens();
    }
  }

  async refreshTokens(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new AuthError('No refresh token available', 'NO_REFRESH_TOKEN');
    }

    const response = await this.request<{
      data: { access_token: string; refresh_token: string; expires_at: number };
    }>('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const tokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: response.data.expires_at,
    };

    this.setTokens(tokens);
    return tokens;
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new AuthError('Not authenticated', 'NOT_AUTHENTICATED');
    }

    const response = await this.request<{ data: User }>('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  async updateProfile(data: { name?: string; avatar_url?: string }): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new AuthError('Not authenticated', 'NOT_AUTHENTICATED');
    }

    const response = await this.request<{ data: User }>('/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new AuthError('Not authenticated', 'NOT_AUTHENTICATED');
    }

    await this.request('/password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Token management
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('token_expires_at', tokens.expires_at.toString());

    // Also set cookie for Next.js middleware (route protection)
    const expiresDate = new Date(tokens.expires_at * 1000);
    document.cookie = `access_token=${tokens.access_token}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax`;
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');

    // Clear cookie as well
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return false;

    return Date.now() < parseInt(expiresAt, 10) * 1000;
  }

  isTokenExpiringSoon(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;

    // Refresh if token expires within 5 minutes
    return Date.now() > (parseInt(expiresAt, 10) - 300) * 1000;
  }
}

export class AuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export const authService = new AuthService(AUTH_API_URL);

// Helper to get auth headers for API requests
export function getAuthHeaders(): Record<string, string> {
  const token = authService.getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
