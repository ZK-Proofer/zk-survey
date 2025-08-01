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
} from "@/services/survey/surveyService";

interface ResponseAnswer {
  questionId: number;
  answer?: string;
  selected_option_id?: number;
  rating_value?: number;
}

export default function MyResponsePage() {
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [response, setResponse] = useState<SurveyResponse | null>(null);
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
      const nullifier = await import("@/lib/zk").then(({ ZkUtil }) =>
        ZkUtil.makeNullifier(uuid, password, surveyData.id)
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
    setResponse(null);
    setError("");
  };

  const getQuestionAnswer = (questionId: number) => {
    if (!response) return null;
    return response.answers.find((answer) => answer.questionId === questionId);
  };

  const getOptionText = (optionId?: number) => {
    if (!optionId || (!response && !survey)) return "";
    const questions = response?.survey.questions || survey?.questions;
    const question = questions?.find((q) =>
      q.options?.some((opt) => opt.id === optionId)
    );
    return question?.options?.find((opt) => opt.id === optionId)?.text || "";
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
              ) : (
                <div className="space-y-6">
                  {/* 설문 정보 */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-2">
                      {response?.survey.title || survey?.title}
                    </h2>
                    {(response?.survey.description || survey?.description) && (
                      <p className="text-gray-600 mb-4">
                        {response?.survey.description || survey?.description}
                      </p>
                    )}
                    {(response?.survey.author || survey?.author) && (
                      <p className="text-sm text-gray-500">
                        작성자:{" "}
                        {(response?.survey.author || survey?.author)?.nickname}
                      </p>
                    )}
                  </div>

                  {/* 질문과 답변 */}
                  <div className="space-y-4">
                    {(response?.survey.questions || survey?.questions)?.map(
                      (question, index) => {
                        const answer = getQuestionAnswer(question.id);
                        const hasAnswer =
                          answer &&
                          (answer.answer ||
                            answer.selected_option_id ||
                            answer.rating_value);

                        return (
                          <div
                            key={question.id}
                            className={`bg-white p-6 rounded-lg border ${
                              hasAnswer ? "border-green-200" : "border-red-200"
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <span className="text-sm font-medium text-gray-500">
                                Q{index + 1}.
                              </span>
                              <h3 className="font-medium flex-1">
                                {question.text}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  hasAnswer
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {hasAnswer ? "답변완료" : "미답변"}
                              </span>
                            </div>

                            <div className="ml-6">
                              {question.type === "TEXT" && (
                                <div className="text-gray-700">
                                  {answer?.answer || "답변 없음"}
                                </div>
                              )}

                              {question.type === "SINGLE_CHOICE" && (
                                <div className="text-gray-700">
                                  {answer?.selected_option_id
                                    ? getOptionText(answer.selected_option_id)
                                    : "답변 없음"}
                                </div>
                              )}

                              {question.type === "MULTIPLE_CHOICE" && (
                                <div className="text-gray-700">
                                  {answer?.selected_option_id
                                    ? getOptionText(answer.selected_option_id)
                                    : "답변 없음"}
                                </div>
                              )}

                              {question.type === "RATING" && (
                                <div className="text-gray-700">
                                  {answer?.rating_value
                                    ? `${answer.rating_value}점`
                                    : "답변 없음"}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    다른 응답 확인하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
