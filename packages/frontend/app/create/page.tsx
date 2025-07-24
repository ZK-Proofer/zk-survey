"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SurveyForm {
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: "TEXT" | "MULTIPLE_CHOICE" | "RATING";
  options?: string[];
  order_index: number;
  is_required: boolean;
}

export default function CreateSurvey() {
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyForm>({
    title: "",
    description: "",
    questions: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "TEXT",
      order_index: survey.questions.length,
      is_required: true,
    };
    setSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (
    id: string,
    field: keyof Question,
    value: string | string[] | number | boolean
  ) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeQuestion = (id: string) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.id !== id)
        .map((q, index) => ({ ...q, order_index: index })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(survey),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/survey/${result.id}/success`);
      } else {
        alert("Failed to create survey.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the survey.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create New Survey
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Title *
                </label>
                <input
                  type="text"
                  required
                  value={survey.title}
                  onChange={(e) =>
                    setSurvey((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter survey title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Description
                </label>
                <textarea
                  value={survey.description}
                  onChange={(e) =>
                    setSurvey((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter survey description"
                />
              </div>
            </div>

            {/* Questions List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Questions
                </h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {survey.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <input
                          type="text"
                          required
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(question.id, "text", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your question"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Type
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "type",
                              e.target.value as any
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TEXT">Text</option>
                          <option value="MULTIPLE_CHOICE">
                            Multiple Choice
                          </option>
                          <option value="RATING">Rating</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required-${question.id}`}
                          checked={question.is_required}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "is_required",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        <label
                          htmlFor={`required-${question.id}`}
                          className="text-sm text-gray-700"
                        >
                          Required question
                        </label>
                      </div>

                      {question.type === "MULTIPLE_CHOICE" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options (one per line)
                          </label>
                          <textarea
                            value={question.options?.join("\n") || ""}
                            onChange={(e) =>
                              updateQuestion(
                                question.id,
                                "options",
                                e.target.value.split("\n").filter(Boolean)
                              )
                            }
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter options, one per line"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || survey.questions.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Creating..." : "Create Survey"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
