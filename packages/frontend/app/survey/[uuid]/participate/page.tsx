"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";

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
  answer: string;
  selected_option_id?: number;
  rating_value?: number;
}

export default function ParticipateSurvey() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = params.uuid as string;
  const commitmentHash = searchParams.get("hash");

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState("");

  // 비밀번호 확인 Dialog 상태
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordVerifying, setIsPasswordVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!commitmentHash) {
      setError("Invalid access. Please use the invitation link.");
      setIsLoading(false);
      return;
    }

    fetchSurveyData();
  }, [uuid, commitmentHash]);

  const fetchSurveyData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/invitation/${uuid}`
      );

      if (response.ok) {
        const data = await response.json();
        setSurvey(data);
        // Initialize empty answers
        const initialAnswers = data.questions.map((q: Question) => ({
          questionId: q.id,
          answer: "",
        }));
        setAnswers(initialAnswers);
      } else {
        const errorData = await response.json();
        if (response.status === 409 && errorData.message?.includes("closed")) {
          throw new Error("이 설문은 이미 종료되어 참여할 수 없습니다.");
        }
        throw new Error("Failed to fetch survey");
      }
    } catch (error) {
      setError("Failed to load survey information.");
    } finally {
      setIsLoading(false);
    }
  };

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
      return question && !a.answer.trim();
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

    if (!survey) {
      setError("Survey not found.");
      return;
    }

    setIsPasswordVerifying(true);
    setPasswordError("");

    try {
      // 새로운 커밋먼트 해시 생성
      const newCommitmentHash = await ZkUtil.makeCommitment(
        password.trim(),
        uuid
      );

      // 백엔드에 커밋먼트 검증 요청
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/invitation/${uuid}/commitment/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commitmentHash: newCommitmentHash }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || "비밀번호가 올바르지 않습니다.");
      }

      const leaves = (await verifyResponse.json()).leaves;

      setIsGeneratingProof(true);
      const { proof, nullifier } = await ZkUtil.generateProof(
        password.trim(),
        uuid,
        survey.id,
        leaves
      );
      setIsGeneratingProof(false);

      // 설문 제출
      const submitResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${uuid}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proof,
            nullifier,
            answers,
            commitmentHash: newCommitmentHash,
            resultLink: `${window.location.origin}/my-response`,
          }),
        }
      );

      if (submitResponse.ok) {
        setShowPasswordDialog(false);
        router.push(`/survey/${uuid}/complete`);
      } else {
        const errorData = await submitResponse.json();
        if (
          submitResponse.status === 409 &&
          errorData.message?.includes("closed")
        ) {
          throw new Error("이 설문은 이미 종료되어 참여할 수 없습니다.");
        }
        throw new Error(errorData.message || "Failed to submit survey.");
      }
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

  if (isLoading) {
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
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                {survey.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {survey.description}
              </CardDescription>
              <p className="text-sm text-gray-500">
                작성자: {survey.author.nickname}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {survey.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border-b border-gray-200 pb-6"
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
                      <Textarea
                        value={
                          answers.find((a) => a.questionId === question.id)
                            ?.answer || ""
                        }
                        onChange={(e) =>
                          updateAnswer(question.id, e.target.value)
                        }
                        placeholder="답변을 입력하세요"
                        required={question.is_required}
                        rows={3}
                      />
                    )}

                    {question.type === "SINGLE_CHOICE" && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <Label
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.text}
                              checked={
                                answers.find(
                                  (a) => a.questionId === question.id
                                )?.answer === option.text
                              }
                              onChange={(e) =>
                                updateAnswer(
                                  question.id,
                                  e.target.value,
                                  option.id
                                )
                              }
                              className="mr-3"
                              required={question.is_required}
                            />
                            <span>{option.text}</span>
                          </Label>
                        ))}
                      </div>
                    )}

                    {question.type === "MULTIPLE_CHOICE" &&
                      question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <Label
                              key={option.id}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                value={option.text}
                                checked={
                                  answers
                                    .find((a) => a.questionId === question.id)
                                    ?.answer?.includes(option.text) || false
                                }
                                onChange={(e) => {
                                  const currentAnswer =
                                    answers.find(
                                      (a) => a.questionId === question.id
                                    )?.answer || "";
                                  const newAnswer = e.target.checked
                                    ? currentAnswer
                                      ? `${currentAnswer}, ${option.text}`
                                      : option.text
                                    : currentAnswer
                                        .replace(`, ${option.text}`, "")
                                        .replace(option.text, "")
                                        .replace(/^,\s*/, "");
                                  updateAnswer(
                                    question.id,
                                    newAnswer,
                                    option.id
                                  );
                                }}
                                className="mr-3"
                              />
                              <span>{option.text}</span>
                            </Label>
                          ))}
                        </div>
                      )}

                    {question.type === "RATING" && (
                      <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Label
                            key={rating}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="radio"
                              name={`rating-${question.id}`}
                              value={rating.toString()}
                              checked={
                                answers.find(
                                  (a) => a.questionId === question.id
                                )?.answer === rating.toString()
                              }
                              onChange={(e) =>
                                updateAnswer(
                                  question.id,
                                  e.target.value,
                                  undefined,
                                  rating
                                )
                              }
                              className="mr-2"
                              required={question.is_required}
                            />
                            <span>{rating}</span>
                          </Label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isGeneratingProof
                      ? "증명 생성 중..."
                      : isSubmitting
                        ? "제출 중..."
                        : "설문 제출"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 비밀번호 확인 Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 확인</DialogTitle>
            <DialogDescription>
              설문을 제출하기 위해 비밀번호를 한 번 더 입력해주세요.
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
              ) : (
                "확인"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
