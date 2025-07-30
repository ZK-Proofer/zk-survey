import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SurveyService,
  CreateSurveyDto,
} from "@/services/survey/surveyService";

export interface Question {
  id: string;
  text: string;
  type: "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "RATING";
  options?: string[];
  order_index: number;
  is_required: boolean;
}

export interface SurveyForm {
  title: string;
  description: string;
  questions: Question[];
}

export function useCreateSurvey() {
  const [survey, setSurvey] = useState<SurveyForm>({
    title: "",
    description: "",
    questions: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  const transformSurveyForBackend = (survey: SurveyForm): CreateSurveyDto => {
    return {
      title: survey.title,
      description: survey.description,
      questions: survey.questions.map((q) => ({
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
  };

  const createSurvey = async () => {
    try {
      setIsSubmitting(true);
      const transformedSurvey = transformSurveyForBackend(survey);
      const result = await SurveyService.createSurvey(transformedSurvey);
      router.push(`/my-surveys/${result.id}`);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    survey,
    setSurvey,
    isSubmitting,
    addQuestion,
    updateQuestion,
    removeQuestion,
    createSurvey,
  };
}
