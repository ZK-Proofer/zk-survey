"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";

interface SurveyResult {
  survey: {
    id: number;
    title: string;
    description: string;
    status: string;
    totalResponses: number;
  };
  questionStats: Array<{
    questionId: number;
    questionText: string;
    questionType: string;
    totalAnswers: number;
    answers: Array<{
      answerText: string;
      selectedOptionId?: number;
      ratingValue?: number;
      createdAt: string;
    }>;
    optionStats?: Array<{
      optionId: number;
      optionText: string;
      count: number;
    }>;
    ratingStats?: Array<{
      rating: number;
      count: number;
    }>;
  }>;
  responses: Array<{
    id: number;
    nullifierHash: string;
    createdAt: string;
    answers: Array<{
      questionId: number;
      answerText: string;
      selectedOptionId?: number;
      ratingValue?: number;
    }>;
  }>;
}

export default function SurveyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  const [results, setResults] = useState<SurveyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSurveyResults = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${surveyId}/results`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch survey results");
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "결과를 불러올 수 없습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchSurveyResults();
    }
  }, [surveyId, router]);

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "TEXT":
        return "텍스트";
      case "SINGLE_CHOICE":
        return "단일 선택";
      case "MULTIPLE_CHOICE":
        return "다중 선택";
      case "RATING":
        return "평점";
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner message="설문 결과를 불러오는 중..." />;
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

  if (!results) {
    return (
      <ErrorDisplay
        title="결과를 찾을 수 없습니다"
        message="설문 결과가 존재하지 않거나 접근할 수 없습니다."
        showRetry={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button asChild variant="outline">
              <Link href={`/my-surveys/${surveyId}`}>
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                설문 상세로 돌아가기
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                {results.survey.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {results.survey.description}
              </CardDescription>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.survey.totalResponses}
                  </div>
                  <div className="text-blue-800">총 응답 수</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {results.questionStats.length}
                  </div>
                  <div className="text-green-800">질문 수</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {
                      results.questionStats.filter((q) => q.totalAnswers > 0)
                        .length
                    }
                  </div>
                  <div className="text-purple-800">응답된 질문</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.survey.totalResponses > 0 ? "활성" : "비활성"}
                  </div>
                  <div className="text-orange-800">상태</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* 질문별 결과 */}
        <div className="space-y-6">
          {results.questionStats.map((question, index) => (
            <Card key={question.questionId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getQuestionTypeText(question.questionType)}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      {question.questionText}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      총 {question.totalAnswers}개의 응답
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {question.questionType === "TEXT" && (
                  <div className="space-y-3">
                    <h4 className="font-medium">텍스트 응답들:</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {question.answers.map((answer, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">
                            {new Date(answer.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </div>
                          <div className="text-gray-900">
                            {answer.answerText}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.questionType === "SINGLE_CHOICE" &&
                  question.optionStats && (
                    <div className="space-y-3">
                      <h4 className="font-medium">선택 결과:</h4>
                      <div className="space-y-2">
                        {question.optionStats.map((option) => (
                          <div
                            key={option.optionId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-gray-900">
                              {option.optionText}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-blue-600">
                                {option.count}명
                              </span>
                              <span className="text-sm text-gray-500">
                                (
                                {question.totalAnswers > 0
                                  ? Math.round(
                                      (option.count / question.totalAnswers) *
                                        100
                                    )
                                  : 0}
                                %)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {question.questionType === "MULTIPLE_CHOICE" &&
                  question.optionStats && (
                    <div className="space-y-3">
                      <h4 className="font-medium">선택 결과:</h4>
                      <div className="space-y-2">
                        {question.optionStats.map((option) => (
                          <div
                            key={option.optionId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-gray-900">
                              {option.optionText}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-blue-600">
                                {option.count}명
                              </span>
                              <span className="text-sm text-gray-500">
                                (
                                {question.totalAnswers > 0
                                  ? Math.round(
                                      (option.count / question.totalAnswers) *
                                        100
                                    )
                                  : 0}
                                %)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {question.questionType === "RATING" && question.ratingStats && (
                  <div className="space-y-3">
                    <h4 className="font-medium">평점 결과:</h4>
                    <div className="space-y-2">
                      {question.ratingStats.map((rating) => (
                        <div
                          key={rating.rating}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-gray-900">
                            {rating.rating}점
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-blue-600">
                              {rating.count}명
                            </span>
                            <span className="text-sm text-gray-500">
                              (
                              {question.totalAnswers > 0
                                ? Math.round(
                                    (rating.count / question.totalAnswers) * 100
                                  )
                                : 0}
                              %)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 개별 응답 목록 */}
        {results.responses.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>개별 응답 목록</CardTitle>
              <CardDescription>
                각 응답자의 답변을 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.responses.map((response, index) => (
                  <div key={response.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">응답 #{index + 1}</h4>
                      <div className="text-sm text-gray-500">
                        {new Date(response.createdAt).toLocaleDateString(
                          "ko-KR"
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {response.answers.map((answer) => {
                        const question = results.questionStats.find(
                          (q) => q.questionId === answer.questionId
                        );
                        return (
                          <div key={answer.questionId} className="text-sm">
                            <div className="font-medium text-gray-700 mb-1">
                              {question?.questionText}
                            </div>
                            <div className="text-gray-900">
                              {answer.answerText || `${answer.ratingValue}점`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.survey.totalResponses === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 응답이 없습니다
              </h3>
              <p className="text-gray-500">
                설문에 대한 응답이 아직 없습니다. 초대링크를 통해 참여자를
                초대해보세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
