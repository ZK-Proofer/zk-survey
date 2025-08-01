"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ZkUtil } from "@/lib/zk";
import { SurveyHeader } from "@/components/survey/SurveyHeader";
import { SurveyForm } from "@/components/survey/SurveyForm";

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

interface Answer {
  questionId: number;
  answer?: string;
  selected_option_id?: number;
  rating_value?: number;
}

interface SurveyParticipateFormProps {
  survey: SurveyData;
  initialAnswers?: Answer[];
  isEditMode?: boolean;
  onSubmit: (answers: Answer[], password: string) => Promise<void>;
  onCancel?: () => void;
}

export function SurveyParticipateForm({
  survey,
  initialAnswers = [],
  isEditMode = false,
  onSubmit,
  onCancel,
}: SurveyParticipateFormProps) {
  const getInitialAnswers = () => {
    if (initialAnswers.length > 0) {
      return initialAnswers;
    }
    // 신규 입력일 때 빈 답변 배열 생성
    const emptyAnswers = survey.questions.map((q) => ({
      questionId: q.id,
      answer: "",
    }));
    return emptyAnswers;
  };

  const [answers, setAnswers] = useState<Answer[]>(getInitialAnswers());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState("");

  // 비밀번호 확인 Dialog 상태
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordVerifying, setIsPasswordVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const updateAnswer = (
    questionId: number,
    answer: string,
    selected_option_id?: number,
    rating_value?: number
  ) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questionId
          ? { ...a, answer, selected_option_id, rating_value }
          : a
      )
    );
  };

  const validateAnswers = () => {
    const requiredQuestions =
      survey?.questions.filter((q) => q.is_required) || [];
    const unansweredRequired = answers.filter((a) => {
      const question = requiredQuestions.find((q) => q.id === a.questionId);
      return question && !a.answer?.trim();
    });

    if (unansweredRequired.length > 0) {
      setError("Please answer all required questions.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateAnswers()) {
      return;
    }

    // 비밀번호 확인 Dialog 표시
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = async () => {
    if (!password.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      return;
    }

    setIsPasswordVerifying(true);
    setPasswordError("");

    try {
      await onSubmit(answers, password.trim());
      setShowPasswordDialog(false);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "오류가 발생했습니다."
      );
    } finally {
      setIsPasswordVerifying(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    setPassword("");
    setPasswordError("");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SurveyHeader
            title={survey.title}
            description={survey.description}
            author={survey.author}
            className="mb-6"
          />

          {isEditMode && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>수정 모드</strong> - 응답을 수정하고 있습니다. 수정
                    완료 후 저장 버튼을 클릭하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <SurveyForm
                questions={survey.questions}
                answers={answers}
                onAnswerChange={updateAnswer}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isGeneratingProof={isGeneratingProof}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 비밀번호 확인 Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "응답 수정" : "설문 제출"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "응답을 수정하기 위해 비밀번호를 입력해주세요."
                : "설문을 제출하기 위해 비밀번호를 한 번 더 입력해주세요."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirm-password">비밀번호</Label>
              <Input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordConfirm();
                  }
                }}
              />
              {passwordError && (
                <p className="text-sm text-red-600 mt-1">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handlePasswordCancel}
              disabled={isPasswordVerifying}
            >
              취소
            </Button>
            <Button
              onClick={handlePasswordConfirm}
              disabled={isPasswordVerifying}
            >
              {isPasswordVerifying ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  확인 중...
                </div>
              ) : isEditMode ? (
                "응답 수정"
              ) : (
                "설문 제출"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
