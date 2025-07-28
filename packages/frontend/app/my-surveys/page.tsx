"use client";

import { useSurveys } from "@/hooks/survey/useSurveys";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { SurveyList } from "@/components/survey/SurveyList";

export default function MySurveysPage() {
  const { surveys, loading, error, refetch } = useSurveys();

  if (loading) {
    return <LoadingSpinner message="설문 목록을 불러오는 중..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="오류가 발생했습니다"
        message={error}
        onRetry={refetch}
      />
    );
  }

  return <SurveyList surveys={surveys} />;
}
