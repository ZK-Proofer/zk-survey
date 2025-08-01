"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/common/Header";
import {
  SurveyService,
  Survey,
  SurveyResponse,
  AnswerResponse,
} from "@/services/survey/surveyService";
import { SurveyParticipateForm } from "@/components/survey/SurveyParticipateForm";
import { ZkUtil } from "@/lib/zk";

interface FormAnswer {
  questionId: number;
  answer?: string;
  selected_option_id?: number;
  rating_value?: number;
}

export default function MyResponsePage() {
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [response, setResponse] = useState<AnswerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 설문 데이터 가져오기
      const surveyData = await SurveyService.getSurveyByUuid(uuid);

      // nullifier 생성
      const nullifier = await ZkUtil.makeNullifier(
        password,
        uuid,
        surveyData.id
      );

      // 응답 데이터 가져오기
      const responseData =
        await SurveyService.getResponseByNullifier(nullifier);

      setSurvey(surveyData);
      setResponse(responseData);
    } catch (error) {
      console.error("Error fetching response:", error);
      setError("응답을 찾을 수 없습니다. UUID와 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUuid("");
    setPassword("");
    setSurvey(null);
    setResponse([]);
    setError("");
  };

  const handleUpdateResponse = async (
    answers: FormAnswer[],
    password: string
  ) => {
    if (!response || !survey) {
      throw new Error("응답 데이터가 없습니다.");
    }

    // 새로운 커밋먼트 해시 생성
    const newCommitmentHash = await ZkUtil.makeCommitment(password, uuid);

    // 백엔드에 커밋먼트 검증 요청
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/invitation/${uuid}/commitment/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commitmentHash: newCommitmentHash }),
      }
    );

    const oldNullifier = await ZkUtil.makeNullifier(password, uuid, survey.id);

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(errorData.message || "비밀번호가 올바르지 않습니다.");
    }

    const leaves = (await verifyResponse.json()).leaves;

    const { proof, nullifier: newNullifier } = await ZkUtil.generateProof(
      password,
      uuid,
      survey.id,
      leaves
    );

    // 백엔드에 응답 업데이트 요청
    const updateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/response/${oldNullifier}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof,
          newNullifier,
          answers,
        }),
      }
    );

    if (updateResponse.ok) {
      // 업데이트된 응답 다시 가져오기
      const updatedResponse =
        await SurveyService.getResponseByNullifier(newNullifier);
      setResponse(updatedResponse);
      alert("응답이 성공적으로 수정되었습니다!");
    } else {
      const errorData = await updateResponse.json();
      throw new Error(errorData.message || "응답 수정에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                내 응답 확인하기
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!survey ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="uuid">설문 UUID</Label>
                    <Input
                      id="uuid"
                      type="text"
                      value={uuid}
                      onChange={(e) => setUuid(e.target.value)}
                      placeholder="설문 UUID를 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="설문 참여 시 사용한 비밀번호를 입력하세요"
                      required
                    />
                  </div>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "확인 중..." : "응답 확인하기"}
                  </Button>
                </form>
              ) : response && survey ? (
                <SurveyParticipateForm
                  survey={{
                    id: survey.id,
                    title: survey.title,
                    description: survey.description,
                    questions: survey.questions,
                    author: survey.author,
                  }}
                  initialAnswers={response}
                  isEditMode={true}
                  onSubmit={handleUpdateResponse}
                />
              ) : null}

              {survey && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full mt-4"
                >
                  다른 응답 확인하기
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
