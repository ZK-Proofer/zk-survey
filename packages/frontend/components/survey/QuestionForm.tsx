import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "@/hooks/survey/useCreateSurvey";

interface QuestionFormProps {
  question: Question;
  index: number;
  onUpdate: (
    id: string,
    field: keyof Question,
    value: string | string[] | number | boolean
  ) => void;
  onRemove: (id: string) => void;
}

export function QuestionForm({
  question,
  index,
  onUpdate,
  onRemove,
}: QuestionFormProps) {
  const questionTypes = [
    { value: "TEXT", label: "텍스트" },
    { value: "SINGLE_CHOICE", label: "단일 선택" },
    { value: "MULTIPLE_CHOICE", label: "다중 선택" },
    { value: "RATING", label: "평점" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>질문 {index + 1}</CardTitle>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(question.id)}
          >
            삭제
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`question-${question.id}`}>질문 내용 *</Label>
          <Input
            id={`question-${question.id}`}
            type="text"
            required
            value={question.text}
            onChange={(e) => onUpdate(question.id, "text", e.target.value)}
            placeholder="질문을 입력하세요"
          />
        </div>

        <div>
          <Label htmlFor={`type-${question.id}`}>질문 유형</Label>
          <Select
            value={question.type}
            onValueChange={(value: string) =>
              onUpdate(question.id, "type", value as any)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="질문 유형을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`required-${question.id}`}
            checked={question.is_required}
            onCheckedChange={(checked: boolean) =>
              onUpdate(question.id, "is_required", checked)
            }
          />
          <Label htmlFor={`required-${question.id}`}>필수 질문</Label>
        </div>

        {(question.type === "SINGLE_CHOICE" ||
          question.type === "MULTIPLE_CHOICE") && (
          <div>
            <Label htmlFor={`options-${question.id}`}>
              선택지 (한 줄에 하나씩)
            </Label>
            <Textarea
              id={`options-${question.id}`}
              value={question.options?.join("\n") || ""}
              onChange={(e) =>
                onUpdate(
                  question.id,
                  "options",
                  e.target.value.split("\n").filter(Boolean)
                )
              }
              placeholder="선택지를 입력하세요 (한 줄에 하나씩)"
              rows={4}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
