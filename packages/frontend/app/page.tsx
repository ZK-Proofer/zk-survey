"use client";

import { Header } from "@/components/common/Header";
import { useAuth } from "@/hooks/auth/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { HomeContent } from "@/components/survey/HomeContent";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HomeContent user={user} />
    </div>
  );
}
