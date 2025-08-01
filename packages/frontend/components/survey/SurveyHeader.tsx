import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SurveyHeaderProps {
  title: string;
  description: string;
  author?: {
    nickname: string;
  };
  className?: string;
}

export function SurveyHeader({
  title,
  description,
  author,
  className = "",
}: SurveyHeaderProps) {
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">{title}</CardTitle>
        <CardDescription className="text-lg">{description}</CardDescription>
        {author && (
          <p className="text-sm text-gray-500">작성자: {author.nickname}</p>
        )}
      </CardHeader>
    </Card>
  );
}
