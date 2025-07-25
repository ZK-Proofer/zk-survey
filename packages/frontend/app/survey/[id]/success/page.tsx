"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SurveySuccess() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  const [survey, setSurvey] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 설문 정보 가져오기
    const fetchSurveyInfo = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111";

        const response = await fetch(
          `${backendUrl}/api/v1/survey/${surveyId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSurvey(data);
        }
      } catch (error) {
        console.error("Failed to fetch survey:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyInfo();
  }, [surveyId]);

  const copyInvitationLink = () => {
    if (!survey?.invitation?.uuid) {
      alert("Invitation link not available yet.");
      return;
    }
    const link = `${window.location.origin}/survey/${survey.invitation.uuid}`;
    navigator.clipboard.writeText(link);
    alert("Invitation link copied to clipboard!");
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Survey Created Successfully!
            </h1>
            <p className="text-gray-800 text-lg">
              Your survey "{survey?.title}" has been created and is ready to
              share.
            </p>
          </div>

          {survey && (
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Survey Details
              </h2>
              <div className="text-left space-y-3">
                <p className="text-gray-900">
                  <strong className="text-gray-800">Title:</strong>{" "}
                  {survey.title}
                </p>
                <p className="text-gray-900">
                  <strong className="text-gray-800">Description:</strong>{" "}
                  {survey.description || "No description"}
                </p>
                <p className="text-gray-900">
                  <strong className="text-gray-800">Questions:</strong>{" "}
                  {survey.questions?.length || 0}
                </p>
                <p className="text-gray-900">
                  <strong className="text-gray-800">Status:</strong>{" "}
                  {survey.status}
                </p>
                {survey.invitation && (
                  <p className="text-gray-900">
                    <strong className="text-gray-800">Invitation UUID:</strong>{" "}
                    {survey.invitation.uuid}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={copyInvitationLink}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Copy Invitation Link
            </button>

            <button
              onClick={() => router.push("/create")}
              className="w-full px-6 py-3 border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Create Another Survey
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full px-6 py-3 border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
