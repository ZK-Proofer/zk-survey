"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/auth/useAuth";

function LoginContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleGoogleCallback = async (code: string) => {
    try {
      await login(code);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Google OAuth callback 처리
  const code = searchParams.get("code");
  if (code) {
    handleGoogleCallback(code);
    return <LoadingSpinner message="로그인 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <LoginContent />
    </Suspense>
  );
}
