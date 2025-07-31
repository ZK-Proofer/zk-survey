import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Survey } from "@/services/survey/surveyService";

interface SurveyCardProps {
  survey: Survey;
}

export function SurveyCard({ survey }: SurveyCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "초안";
      case "ACTIVE":
        return "발행됨";
      case "CLOSED":
        return "종료됨";
      default:
        return status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
              {survey.title}
            </CardTitle>
            <CardDescription className="line-clamp-3 mb-3">
              {survey.description}
            </CardDescription>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(survey.status)}`}
          >
            {getStatusText(survey.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">생성일:</span>{" "}
            {new Date(survey.created_at).toLocaleDateString("ko-KR")}
          </div>
          <div>
            <span className="font-medium">질문 수:</span>{" "}
            {survey.questions.length}개
          </div>
          <div>
            <span className="font-medium">필수 질문:</span>{" "}
            {survey.questions.filter((q) => q.is_required).length}개
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/my-surveys/${survey.id}`}>상세보기</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/survey/preview/${survey.id}`}>미리보기</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
