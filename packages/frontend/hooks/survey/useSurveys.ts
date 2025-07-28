import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SurveyService, Survey } from "@/services/survey/surveyService";

export function useSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SurveyService.getMySurveys();
      setSurveys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  return {
    surveys,
    loading,
    error,
    refetch: fetchSurveys,
  };
}
