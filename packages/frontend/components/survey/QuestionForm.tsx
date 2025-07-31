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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function QuestionForm({
  question,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
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
          <div className="flex space-x-2">
            {onMoveUp && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveUp}
              >
                ↑
              </Button>
            )}
            {onMoveDown && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveDown}
              >
                ↓
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemove(question.id)}
            >
              삭제
            </Button>
          </div>
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
            onValueChange={(value: string) => {
              onUpdate(question.id, "type", value as any);
              // 단일선택이나 다중선택으로 변경할 때 기본 선택지 추가
              if (
                (value === "SINGLE_CHOICE" || value === "MULTIPLE_CHOICE") &&
                (!question.options || question.options.length === 0)
              ) {
                onUpdate(question.id, "options", ["", ""]);
              }
            }}
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor={`options-${question.id}`}>선택지</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(question.options || []), ""];
                  onUpdate(question.id, "options", newOptions);
                }}
              >
                선택지 추가
              </Button>
            </div>
            <div className="space-y-2">
              {(question.options || []).map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      onUpdate(question.id, "options", newOptions);
                    }}
                    placeholder={`선택지 ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newOptions = (question.options || []).filter(
                        (_, index) => index !== optionIndex
                      );
                      onUpdate(question.id, "options", newOptions);
                    }}
                    disabled={(question.options || []).length <= 1}
                  >
                    삭제
                  </Button>
                </div>
              ))}
              {(question.options || []).length === 0 && (
                <div className="text-sm text-gray-500">
                  선택지를 추가해주세요.
                </div>
              )}
              {(question.options || []).some((option) => !option.trim()) && (
                <div className="text-sm text-yellow-600">
                  ⚠️ 빈 선택지가 있습니다. 모든 선택지를 입력해주세요.
                </div>
              )}
              {(question.options || []).length > 1 &&
                new Set(question.options?.filter((opt) => opt.trim())).size !==
                  (question.options?.filter((opt) => opt.trim()).length ||
                    0) && (
                  <div className="text-sm text-red-600">
                    ⚠️ 중복된 선택지가 있습니다. 각 선택지는 고유해야 합니다.
                  </div>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
