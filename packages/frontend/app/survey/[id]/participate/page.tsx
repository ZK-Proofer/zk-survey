"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface QuestionOption {
  id: number;
  text: string;
  order_index: number;
}

interface Question {
  id: number;
  text: string;
  type: "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "RATING";
  order_index: number;
  is_required: boolean;
  options?: QuestionOption[];
}

interface SurveyData {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  author: {
    nickname: string;
  };
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
  const id = params.id as string;

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSurveyData();
  }, [id]);

  const fetchSurveyData = async () => {
    try {
      const response = await fetch(`/api/survey/${id}/questions`);
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
      const response = await fetch("/api/survey/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid: id,
          surveyId: survey?.id,
          answers,
        }),
      });

      if (response.ok) {
        router.push(`/survey/${id}/complete`);
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

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers.find((a) => a.questionId === question.id);

    switch (question.type) {
      case "TEXT":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer {question.is_required && "*"}
            </label>
            <textarea
              required={question.is_required}
              value={answer?.answer || ""}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter your answer"
            />
          </div>
        );

      case "SINGLE_CHOICE":
      case "MULTIPLE_CHOICE":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer {question.is_required && "*"}
            </label>
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.text}
                    checked={answer?.answer === option.text}
                    onChange={(e) =>
                      updateAnswer(question.id, e.target.value, option.id)
                    }
                    required={question.is_required}
                    className="mr-2"
                  />
                  <span className="text-gray-900 font-medium">
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case "RATING":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating {question.is_required && "*"}
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={rating.toString()}
                    checked={answer?.answer === rating.toString()}
                    onChange={(e) =>
                      updateAnswer(
                        question.id,
                        e.target.value,
                        undefined,
                        rating
                      )
                    }
                    required={question.is_required}
                    className="mr-1"
                  />
                  <span className="text-gray-900 font-medium">{rating}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
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

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || "Survey not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {survey.title}
            </h1>
            <p className="text-gray-800 mb-4 text-lg leading-relaxed">
              {survey.description}
            </p>
            <p className="text-sm text-gray-700 font-medium">
              Author: {survey.author.nickname}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {survey.questions
              .sort((a, b) => a.order_index - b.order_index)
              .map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Question {index + 1}: {question.text}
                    {question.is_required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  {renderQuestion(question, index)}
                </div>
              ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Survey"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
