import { useState, useEffect } from "react";
import { SurveyService, Survey } from "@/services/survey/surveyService";

export function useSurveyInvitation(uuid: string) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SurveyService.getSurveyByUuid(uuid);
      setSurvey(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const verifyCommitment = async (commitmentHash: string) => {
    try {
      const response = await SurveyService.verifyCommitment(
        uuid,
        commitmentHash
      );
      return response;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (uuid) {
      fetchSurvey();
    }
  }, [uuid]);

  return {
    survey,
    loading,
    error,
    verifyCommitment,
    refetch: fetchSurvey,
  };
}
