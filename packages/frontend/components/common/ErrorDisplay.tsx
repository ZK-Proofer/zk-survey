import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorDisplay({
  title = "오류가 발생했습니다",
  message,
  onRetry,
  showRetry = true,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">{title}</CardTitle>
          <CardDescription className="text-gray-600">{message}</CardDescription>
        </CardHeader>
        {showRetry && onRetry && (
          <CardContent>
            <Button onClick={onRetry} className="w-full">
              다시 시도
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
