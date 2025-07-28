const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  member: {
    id: number;
    email: string;
    nickname: string;
  };
}

export class AuthService {
  static async loginWithGoogle(
    code: string,
    redirectUri: string
  ): Promise<LoginResponse> {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "로그인에 실패했습니다.");
    }

    return response.json();
  }

  static getGoogleAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/login`;
    const scope = "email profile";

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }
}
