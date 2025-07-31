"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { SurveyService, Survey } from "@/services/survey/surveyService";

interface SurveyData {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  author: {
    nickname: string;
  };
}

interface Question {
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
}

export default function SurveyPreview() {
  const params = useParams();
  const surveyId = params.id as string;
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const data = await SurveyService.getSurveyPreview(parseInt(surveyId));
        setSurvey(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "설문을 불러올 수 없습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchSurveyData();
    }
  }, [surveyId]);

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
        message="설문이 존재하지 않거나 접근할 수 없습니다."
        showRetry={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{survey.title}</CardTitle>
            <CardDescription className="text-lg">
              {survey.description}
            </CardDescription>
            <p className="text-sm text-gray-500">
              작성자: {survey.author.nickname}
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📋 이는 미리보기 모드입니다. 실제 설문 참여는 초대 링크를 통해
                가능합니다.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {survey.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">
                      {index + 1}. {question.text}
                      {question.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                  </div>

                  {question.type === "TEXT" && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="답변을 입력하세요 (미리보기)"
                        rows={3}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        텍스트 입력 필드 (미리보기)
                      </p>
                    </div>
                  )}

                  {question.type === "SINGLE_CHOICE" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <Label
                          key={option.id}
                          className="flex items-center space-x-2 cursor-not-allowed"
                        >
                          <input
                            type="radio"
                            name={`preview-${question.id}`}
                            disabled
                            className="mr-3 opacity-50"
                          />
                          <span className="text-gray-600">{option.text}</span>
                        </Label>
                      ))}
                      <p className="text-xs text-gray-500">
                        단일 선택 (미리보기)
                      </p>
                    </div>
                  )}

                  {question.type === "MULTIPLE_CHOICE" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <Label
                          key={option.id}
                          className="flex items-center space-x-2 cursor-not-allowed"
                        >
                          <input
                            type="checkbox"
                            disabled
                            className="mr-3 opacity-50"
                          />
                          <span className="text-gray-600">{option.text}</span>
                        </Label>
                      ))}
                      <p className="text-xs text-gray-500">
                        다중 선택 (미리보기)
                      </p>
                    </div>
                  )}

                  {question.type === "RATING" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Label
                            key={rating}
                            className="flex items-center space-x-2 cursor-not-allowed"
                          >
                            <input
                              type="radio"
                              name={`preview-rating-${question.id}`}
                              disabled
                              className="mr-2 opacity-50"
                            />
                            <span className="text-gray-600">{rating}</span>
                          </Label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        평점 (1-5점) (미리보기)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    미리보기 모드
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      이 페이지는 설문의 모양과 구조를 미리 확인할 수 있는
                      미리보기입니다. 실제 설문 참여는 초대 링크를 통해
                      가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <Button variant="outline" onClick={() => window.history.back()}>
                뒤로 가기
              </Button>
              <Button asChild>
                <a href={`/my-surveys/${survey.id}`}>설문 관리</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
