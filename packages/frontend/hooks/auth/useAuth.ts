import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService, LoginResponse } from "@/services/auth/authService";

export interface User {
  id: number;
  email: string;
  nickname: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (code: string) => {
    try {
      const response = await AuthService.loginWithGoogle(
        code,
        `${window.location.origin}/login`
      );

      // 토큰을 로컬 스토리지에 저장
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.member));

      setUser(response.member);
      router.push("/");

      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const initiateGoogleLogin = () => {
    const googleAuthUrl = AuthService.getGoogleAuthUrl();
    window.location.href = googleAuthUrl;
  };

  return {
    user,
    isLoading,
    login,
    logout,
    initiateGoogleLogin,
  };
}
