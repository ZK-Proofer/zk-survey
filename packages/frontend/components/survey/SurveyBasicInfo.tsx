import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SurveyBasicInfoProps {
  title: string;
  description: string;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onUpdate?: (field: "title" | "description", value: string) => void;
}

export function SurveyBasicInfo({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onUpdate,
}: SurveyBasicInfoProps) {
  const handleTitleChange = (value: string) => {
    if (onUpdate) {
      onUpdate("title", value);
    } else if (onTitleChange) {
      onTitleChange(value);
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (onUpdate) {
      onUpdate("description", value);
    } else if (onDescriptionChange) {
      onDescriptionChange(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">설문 제목 *</Label>
          <Input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="설문 제목을 입력하세요"
          />
        </div>

        <div>
          <Label htmlFor="description">설문 설명</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="설문에 대한 설명을 입력하세요"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
