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
  const [error, setError] = useState("");

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
        setError("Survey not found.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Check if all required questions are answered
    const requiredQuestions =
      survey?.questions.filter((q) => q.is_required) || [];
    const unansweredRequired = answers.filter((a) => {
      const question = requiredQuestions.find((q) => q.id === a.questionId);
      return question && !a.answer.trim();
    });

    if (unansweredRequired.length > 0) {
      setError("Please answer all required questions.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${uuid}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid: uuid,
            commitmentHash: commitmentHash,
            answers,
          }),
        }
      );

      if (response.ok) {
        router.push(`/survey/${uuid}/complete`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit survey.");
      }
    } catch (error) {
      setError("An error occurred while submitting the survey.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription className="text-gray-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Survey not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
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
                              answers.find((a) => a.questionId === question.id)
                                ?.answer === option.text
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

                  {question.type === "MULTIPLE_CHOICE" && question.options && (
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
                              updateAnswer(question.id, newAnswer, option.id);
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
                              answers.find((a) => a.questionId === question.id)
                                ?.answer === rating.toString()
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
                  {isSubmitting ? "제출 중..." : "설문 제출"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
