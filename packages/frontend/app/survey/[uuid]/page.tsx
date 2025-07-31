"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ZkUtil } from "@/lib/zk";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";

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

        if (!response.ok) {
          const errorData = await response.json();
          if (
            response.status === 409 &&
            errorData.message?.includes("closed")
          ) {
            throw new Error("이 설문은 이미 종료되어 참여할 수 없습니다.");
          }
          throw new Error("Failed to fetch survey");
        }

        const data = await response.json();
        setSurvey(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
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
      const commitmentHash = await ZkUtil.makeCommitment(password.trim(), uuid);

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
        throw new Error(errorData.message || "커밋먼트 검증에 실패했습니다.");
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
    return <LoadingSpinner message="설문 정보를 불러오는 중..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="오류가 발생했습니다"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!survey) {
    return (
      <ErrorDisplay
        title="설문을 찾을 수 없습니다"
        message="초대링크가 올바르지 않거나 만료되었습니다."
        showRetry={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{survey.title}</CardTitle>
            <CardDescription className="text-lg">
              {survey.description}
            </CardDescription>
            <p className="text-sm text-gray-500">
              작성자: {survey.author.nickname}
            </p>
          </CardHeader>
          <CardContent>
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-center mb-4">
                설문 참여를 위한 비밀번호를 입력해주세요
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uuid">UUID</Label>
                  <Input
                    id="uuid"
                    type="text"
                    disabled
                    value={uuid}
                    className="mb-4"
                  />
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      확인 중...
                    </div>
                  ) : (
                    "설문 참여하기"
                  )}
                </Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
