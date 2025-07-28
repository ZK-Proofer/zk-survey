import { useState, useEffect } from "react";
import { SurveyService, Survey } from "@/services/survey/surveyService";

export function useSurvey(id: number) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SurveyService.getSurveyById(id);
      setSurvey(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await SurveyService.updateSurveyStatus(id, status);
      setSurvey((prev) => (prev ? { ...prev, status } : null));
    } catch (err) {
      throw err;
    }
  };

  const createInvitation = async (email: string) => {
    try {
      const invitation = await SurveyService.createInvitation(id, email);
      return invitation;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (id) {
      fetchSurvey();
    }
  }, [id]);

  return {
    survey,
    loading,
    error,
    updateStatus,
    createInvitation,
    refetch: fetchSurvey,
  };
}
