"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SurveyBasicInfo } from "@/components/survey/SurveyBasicInfo";
import { QuestionForm } from "@/components/survey/QuestionForm";
import { useCreateSurvey } from "@/hooks/survey/useCreateSurvey";
import { useAuth } from "@/hooks/auth/useAuth";

export default function CreateSurvey() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const {
    survey,
    setSurvey,
    isSubmitting,
    addQuestion,
    updateQuestion,
    removeQuestion,
    createSurvey,
  } = useCreateSurvey();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (survey.questions.length === 0) {
      alert("최소 하나의 질문을 추가해주세요.");
      return;
    }

    try {
      await createSurvey();
    } catch (error) {
      console.error("Error:", error);
      alert("설문 생성 중 오류가 발생했습니다.");
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">새 설문 만들기</h1>
            <div className="text-sm text-gray-600">
              안녕하세요, {user?.nickname || user?.email}님!
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <SurveyBasicInfo
              title={survey.title}
              description={survey.description}
              onTitleChange={(title) =>
                setSurvey((prev) => ({ ...prev, title }))
              }
              onDescriptionChange={(description) =>
                setSurvey((prev) => ({ ...prev, description }))
              }
            />

            {/* 질문 목록 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">질문</h2>
                <Button type="button" onClick={addQuestion}>
                  질문 추가
                </Button>
              </div>

              <div className="space-y-4">
                {survey.questions.map((question, index) => (
                  <QuestionForm
                    key={question.id}
                    question={question}
                    index={index}
                    onUpdate={updateQuestion}
                    onRemove={removeQuestion}
                  />
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || survey.questions.length === 0}
                size="lg"
              >
                {isSubmitting ? "생성 중..." : "설문 생성"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
