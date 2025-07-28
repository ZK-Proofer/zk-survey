import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SurveyCard } from "./SurveyCard";
import { Survey } from "@/services/survey/surveyService";

interface SurveyListProps {
  surveys: Survey[];
}

export function SurveyList({ surveys }: SurveyListProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">내 설문 목록</h1>
            <Button asChild>
              <Link href="/create">새 설문 만들기</Link>
            </Button>
          </div>
          <p className="text-gray-600">
            생성한 설문들을 확인하고 관리할 수 있습니다.
          </p>
        </div>

        {surveys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 설문이 없습니다
              </h3>
              <p className="text-gray-500 mb-4">첫 번째 설문을 만들어보세요!</p>
              <Button asChild>
                <Link href="/create">설문 만들기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
