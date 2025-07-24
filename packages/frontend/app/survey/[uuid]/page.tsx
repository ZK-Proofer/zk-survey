"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface SurveyInfo {
  id: string;
  title: string;
  description: string;
  author: {
    nickname: string;
  };
}

export default function SurveyPassword() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [survey, setSurvey] = useState<SurveyInfo | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSurveyInfo();
  }, [uuid]);

  const fetchSurveyInfo = async () => {
    try {
      const response = await fetch(`/api/survey/${uuid}`);
      if (response.ok) {
        const data = await response.json();
        setSurvey(data);
      } else {
        setError("Survey not found.");
      }
    } catch (error) {
      setError("Failed to load survey information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/commitment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid,
          password,
        }),
      });

      if (response.ok) {
        // Navigate to survey participation page
        router.push(`/survey/${uuid}/participate`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Authentication failed.");
      }
    } catch (error) {
      setError("An error occurred during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey information...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || "Survey not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Survey Participation
            </h1>
            <p className="text-gray-600">
              Enter your password to participate in the survey
            </p>
          </div>

          {/* Survey Information */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {survey.title}
            </h2>
            <p className="text-gray-600 text-sm mb-2">{survey.description}</p>
            <p className="text-gray-500 text-xs">
              Author: {survey.author.nickname}
            </p>
          </div>

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the password received via email"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Authenticating..." : "Participate in Survey"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">UUID: {uuid}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
