"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  type: "text" | "multiple_choice" | "rating";
  options?: string[];
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
  questionId: string;
  answer: string;
}

export default function ParticipateSurvey() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSurveyData();
  }, [uuid]);

  const fetchSurveyData = async () => {
    try {
      const response = await fetch(`/api/survey/${uuid}/questions`);
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

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Check if all questions are answered
    const unansweredQuestions = answers.filter((a) => !a.answer.trim());
    if (unansweredQuestions.length > 0) {
      setError("Please answer all questions.");
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
          uuid,
          surveyId: survey?.id,
          answers,
        }),
      });

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

  const renderQuestion = (question: Question, index: number) => {
    const answer =
      answers.find((a) => a.questionId === question.id)?.answer || "";

    switch (question.type) {
      case "text":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer *
            </label>
            <textarea
              required
              value={answer}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your answer"
            />
          </div>
        );

      case "multiple_choice":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer *
            </label>
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answer === option}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case "rating":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={rating.toString()}
                    checked={answer === rating.toString()}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    className="mr-1"
                  />
                  <span className="text-gray-700">{rating}</span>
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
            <p className="text-gray-600 mb-4">{survey.description}</p>
            <p className="text-sm text-gray-500">
              Author: {survey.author.nickname}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {survey.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Question {index + 1}: {question.text}
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
