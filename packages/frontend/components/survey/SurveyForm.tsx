"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

interface SurveyFormProps {
  questions: Question[];
  answers: Answer[];
  onAnswerChange: (
    questionId: number,
    answer: string,
    selected_option_id?: number,
    rating_value?: number
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  isGeneratingProof?: boolean;
  showSubmitButton?: boolean;
  readOnly?: boolean;
}

export function SurveyForm({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  isSubmitting = false,
  isGeneratingProof = false,
  showSubmitButton = true,
  readOnly = false,
}: SurveyFormProps) {
  const updateAnswer = (
    questionId: number,
    answer: string,
    selected_option_id?: number,
    rating_value?: number
  ) => {
    if (!readOnly) {
      onAnswerChange(questionId, answer, selected_option_id, rating_value);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {questions.map((question, index) => (
        <div key={question.id} className="border-b border-gray-200 pb-6">
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
                answers.find((a) => a.questionId === question.id)?.answer || ""
              }
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              placeholder="답변을 입력하세요"
              required={question.is_required}
              rows={3}
              readOnly={readOnly}
            />
          )}

          {question.type === "SINGLE_CHOICE" && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <Label key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.text}
                    checked={
                      answers.find((a) => a.questionId === question.id)
                        ?.answer === option.text
                    }
                    onChange={(e) =>
                      updateAnswer(question.id, e.target.value, option.id)
                    }
                    className="mr-3"
                    required={question.is_required}
                    disabled={readOnly}
                  />
                  <span>{option.text}</span>
                </Label>
              ))}
            </div>
          )}

          {question.type === "MULTIPLE_CHOICE" && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <Label key={option.id} className="flex items-center space-x-2">
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
                        answers.find((a) => a.questionId === question.id)
                          ?.answer || "";
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
                    disabled={readOnly}
                  />
                  <span>{option.text}</span>
                </Label>
              ))}
            </div>
          )}

          {question.type === "RATING" && (
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Label key={rating} className="flex items-center space-x-2">
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
                    disabled={readOnly}
                  />
                  <span>{rating}</span>
                </Label>
              ))}
            </div>
          )}
        </div>
      ))}

      {showSubmitButton && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || readOnly}>
            {isGeneratingProof
              ? "증명 생성 중..."
              : isSubmitting
                ? "제출 중..."
                : "설문 제출"}
          </Button>
        </div>
      )}
    </form>
  );
}
