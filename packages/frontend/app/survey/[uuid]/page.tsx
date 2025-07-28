"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Barretenberg, BarretenbergSync, Fr } from "@aztec/bb.js";

interface SurveyInfo {
  id: number;
  title: string;
  description: string;
  author: {
    nickname: string;
  };
  questions: Array<{
    id: number;
    text: string;
    type: string;
    order_index: number;
    is_required: boolean;
    options?: Array<{
      id: number;
      text: string;
      order_index: number;
    }>;
  }>;
}

async function generatePoseidonHash(
  uuid: string,
  password: string
): Promise<string> {
  const bbsync = await BarretenbergSync.initSingleton();
  const hash = bbsync.poseidon2Hash([
    Fr.fromString(uuid),
    Fr.fromString(password),
  ]);
  console.log(hash);
  return hash.toString();
}

export default function SurveyInvitationPage() {
  const [survey, setSurvey] = useState<SurveyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const uuid = params.uuid as string;

  useEffect(() => {
    const fetchSurveyByUuid = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/invitation/${uuid}`
        );

        console.log(response);

        if (!response.ok) {
          throw new Error("Invalid invitation link");
        }

        const data = await response.json();
        setSurvey(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchSurveyByUuid();
    }
  }, [uuid]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const commitmentHash = await generatePoseidonHash(uuid, password.trim());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/invitation/${uuid}/commitment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commitmentHash }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid commitment");
      }

      const data = await response.json();

      // 성공 시 설문 참여 페이지로 이동
      router.push(`/survey/${uuid}/participate?hash=${commitmentHash}`);
    } catch (err) {
      console.error("Commitment verification failed:", err);
      alert(
        err instanceof Error ? err.message : "비밀번호 확인에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">설문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">오류가 발생했습니다</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">
            설문을 찾을 수 없습니다
          </div>
          <p className="text-gray-600 mb-4">
            초대링크가 올바르지 않거나 만료되었습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {survey.title}
            </h1>
            <p className="text-gray-600 mb-6">{survey.description}</p>
            <div className="text-sm text-gray-500">
              작성자: {survey.author.nickname}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              설문 참여를 위한 비밀번호를 입력해주세요
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor=""
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  uuid
                </label>
                <input
                  type="text"
                  disabled
                  value={uuid}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-5"
                  required
                />
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  비밀번호
                </label>

                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    확인 중...
                  </div>
                ) : (
                  "설문 참여하기"
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    개인정보 보호
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      이 설문은 Zero-Knowledge Proof를 사용하여 개인정보를
                      보호합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
