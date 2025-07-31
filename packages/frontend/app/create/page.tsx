"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/hooks/auth/useAuth";
import { SurveyBasicInfo } from "@/components/survey/SurveyBasicInfo";
import { QuestionForm } from "@/components/survey/QuestionForm";
import { SurveyService } from "@/services/survey/surveyService";
import { Question } from "@/hooks/survey/useCreateSurvey";

interface SurveyData {
  title: string;
  description: string;
  questions: Question[];
}

function CreateSurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { user, isLoading: authLoading } = useAuth();
  const [surveyData, setSurveyData] = useState<SurveyData>({
    title: "",
    description: "",
    questions: [],
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 기존 설문 데이터 로드
  useEffect(() => {
    if (isEditMode && editId) {
      const loadSurveyData = async () => {
        try {
          const survey = await SurveyService.getSurveyById(parseInt(editId));
          setSurveyData({
            title: survey.title,
            description: survey.description,
            questions: survey.questions.map((q) => ({
              id: q.id.toString(),
              text: q.text,
              type: q.type as any,
              order_index: q.order_index,
              is_required: q.is_required,
              options: q.options?.map((o) => o.text) || [],
            })),
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "설문을 불러올 수 없습니다."
          );
        } finally {
          setLoading(false);
        }
      };
      loadSurveyData();
    }
  }, [isEditMode, editId]);

  const handleSubmit = async () => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 백엔드 형식으로 변환
      const transformedData = {
        title: surveyData.title,
        description: surveyData.description,
        questions: surveyData.questions.map((q) => ({
          text: q.text,
          type: q.type,
          order_index: q.order_index,
          is_required: q.is_required,
          options: q.options?.map((option, index) => ({
            text: option,
            order_index: index,
          })),
        })),
      };

      if (isEditMode && editId) {
        // 수정 모드
        await SurveyService.updateSurvey(parseInt(editId), transformedData);
        alert("설문이 성공적으로 수정되었습니다!");
        router.push(`/my-surveys/${editId}`);
      } else {
        // 생성 모드
        const result = await SurveyService.createSurvey(transformedData);
        router.push(`/my-surveys/${result.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "설문 저장에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSurveyData = (field: keyof SurveyData, value: any) => {
    setSurveyData((prev) => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "TEXT",
      order_index: surveyData.questions.length,
      is_required: true,
      options: [],
    };
    setSurveyData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (
    id: string,
    field: keyof Question,
    value: string | string[] | number | boolean
  ) => {
    setSurveyData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeQuestion = (id: string) => {
    setSurveyData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.id !== id)
        .map((q, index) => ({ ...q, order_index: index })),
    }));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setSurveyData((prev) => {
      const newQuestions = [...prev.questions];
      const [movedQuestion] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, movedQuestion);

      // order_index 업데이트
      newQuestions.forEach((q, index) => {
        q.order_index = index;
      });

      return { ...prev, questions: newQuestions };
    });
  };

  if (authLoading || loading) {
    return (
      <LoadingSpinner
        message={isEditMode ? "설문 정보를 불러오는 중..." : "Loading..."}
      />
    );
  }

  if (!user) {
    return (
      <ErrorDisplay
        title="로그인이 필요합니다"
        message="설문을 생성하려면 로그인이 필요합니다."
        showRetry={false}
      />
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? "설문 수정" : "새 설문 만들기"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "기존 설문을 수정합니다. 발행된 설문은 수정할 수 없습니다."
              : "설문 제목과 질문을 입력하여 새로운 설문을 만드세요."}
          </p>
        </div>

        <div className="space-y-6">
          <SurveyBasicInfo
            title={surveyData.title}
            description={surveyData.description}
            onUpdate={updateSurveyData}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>질문 목록</span>
                <Button onClick={addQuestion} type="button">
                  질문 추가
                </Button>
              </CardTitle>
              <CardDescription>
                설문에 포함할 질문들을 추가하세요. 질문 순서는 드래그로 변경할
                수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surveyData.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>아직 질문이 없습니다.</p>
                  <p className="text-sm">
                    위의 "질문 추가" 버튼을 클릭하여 첫 번째 질문을 추가하세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveyData.questions.map((question, index) => (
                    <QuestionForm
                      key={question.id}
                      question={question}
                      index={index}
                      onUpdate={updateQuestion}
                      onRemove={removeQuestion}
                      onMoveUp={
                        index > 0
                          ? () => moveQuestion(index, index - 1)
                          : undefined
                      }
                      onMoveDown={
                        index < surveyData.questions.length - 1
                          ? () => moveQuestion(index, index + 1)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/my-surveys")}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || surveyData.questions.length === 0}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? "수정 중..." : "생성 중..."}
                </div>
              ) : isEditMode ? (
                "설문 수정"
              ) : (
                "설문 생성"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateSurveyPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <CreateSurveyContent />
    </Suspense>
  );
}
