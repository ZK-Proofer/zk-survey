"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Survey {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  author: {
    id: number;
    nickname: string;
  };
  questions: Array<{
    id: number;
    text: string;
    type: string;
    order_index: number;
    is_required: boolean;
    options?: Array<{
      id: number;
      text: string;
      order_index: number;
    }>;
  }>;
}

export default function SurveyDetailPage() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<
    Array<{ email: string; uuid: string; status: string }>
  >([]);
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id;

  useEffect(() => {
    const fetchSurveyDetail = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${surveyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch survey");
        }

        const data = await response.json();
        setSurvey(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchSurveyDetail();
    }
  }, [surveyId, router]);

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

  const publishSurvey = async () => {
    if (!survey) return;

    setIsPublishing(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${surveyId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "ACTIVE" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to publish survey");
      }

      // 설문 상태 업데이트
      setSurvey((prev) => (prev ? { ...prev, status: "ACTIVE" } : null));
      alert("설문이 성공적으로 발행되었습니다!");
    } catch (err) {
      console.error("Failed to publish survey:", err);
      alert("설문 발행에 실패했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };

  const closeSurvey = async () => {
    if (!survey) return;

    if (
      !confirm(
        "정말로 이 설문을 종료하시겠습니까? 종료된 설문은 다시 활성화할 수 없습니다."
      )
    ) {
      return;
    }

    setIsClosing(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${surveyId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "CLOSED" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to close survey");
      }

      // 설문 상태 업데이트
      setSurvey((prev) => (prev ? { ...prev, status: "CLOSED" } : null));
      alert("설문이 성공적으로 종료되었습니다!");
    } catch (err) {
      console.error("Failed to close survey:", err);
      alert("설문 종료에 실패했습니다.");
    } finally {
      setIsClosing(false);
    }
  };

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "TEXT":
        return "텍스트";
      case "SINGLE_CHOICE":
        return "단일 선택";
      case "MULTIPLE_CHOICE":
        return "다중 선택";
      case "RATING":
        return "평점";
      default:
        return type;
    }
  };

  const createInvitationLink = async () => {
    if (!survey || !email.trim()) return;

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setIsCreatingInvitation(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${surveyId}/invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invitation");
      }

      const data = await response.json();
      const newInvitation = {
        email: email.trim(),
        uuid: data.uuid,
        status: data.status,
      };
      setInvitations((prev) => [...prev, newInvitation]);

      setEmail(""); // 이메일 입력 필드 초기화
      alert("초대링크가 성공적으로 생성되었습니다!");
    } catch (err) {
      console.error("Failed to create invitation:", err);
      alert(
        err instanceof Error ? err.message : "초대링크 생성에 실패했습니다."
      );
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const copyInvitationLink = (uuid: string) => {
    const link = `${window.location.origin}/survey/${uuid}`;
    navigator.clipboard.writeText(link);
    alert("초대링크가 복사되었습니다!");
  };

  const handleCopyLink = (uuid: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    copyInvitationLink(uuid);
  };

  const deleteInvitation = (email: string) => {
    if (confirm(`"${email}"의 초대링크를 삭제하시겠습니까?`)) {
      setInvitations((prev) => prev.filter((inv) => inv.email !== email));
    }
  };

  const handleDeleteInvitation = (email: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    deleteInvitation(email);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">설문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
            <CardDescription className="text-gray-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">
              설문을 찾을 수 없습니다
            </CardTitle>
            <CardDescription className="text-gray-600">
              초대링크가 올바르지 않거나 만료되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/my-surveys">목록으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button asChild variant="outline">
              <Link href="/my-surveys">
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                목록으로 돌아가기
              </Link>
            </Button>
            <div className="flex space-x-2">
              {survey.status === "DRAFT" && (
                <Button asChild variant="outline">
                  <Link href={`/create?edit=${survey.id}`}>수정</Link>
                </Button>
              )}
              {survey.status === "ACTIVE" && (
                <Button
                  onClick={closeSurvey}
                  disabled={isClosing}
                  variant="destructive"
                >
                  {isClosing ? "종료 중..." : "설문 종료"}
                </Button>
              )}
              <Button asChild>
                <Link href={`/survey/${survey.id}`}>미리보기</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold mb-2">
                    {survey.title}
                  </CardTitle>
                  <CardDescription className="text-lg mb-4">
                    {survey.description}
                  </CardDescription>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(survey.status)}`}
                >
                  {getStatusText(survey.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">생성일:</span>
                  <br />
                  {new Date(survey.created_at).toLocaleDateString("ko-KR")}
                </div>
                <div>
                  <span className="font-medium">질문 수:</span>
                  <br />
                  {survey.questions.length}개
                </div>
                <div>
                  <span className="font-medium">필수 질문:</span>
                  <br />
                  {survey.questions.filter((q) => q.is_required).length}개
                </div>
                <div>
                  <span className="font-medium">선택 질문:</span>
                  <br />
                  {survey.questions.filter((q) => !q.is_required).length}개
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* 질문 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">질문 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="py-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3">
                          {index + 1}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            question.is_required
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {question.is_required ? "필수" : "선택"}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {getQuestionTypeText(question.type)}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium">{question.text}</h3>
                    </div>
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        선택지:
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center">
                            <div className="w-4 h-4 border border-gray-300 rounded mr-3"></div>
                            <span className="text-gray-700">{option.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 초대링크 생성 */}
        {survey.status === "ACTIVE" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                초대링크 생성
              </CardTitle>
              <CardDescription>
                참여자들의 이메일을 입력하여 개별 초대링크를 생성할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="email">참여자 이메일 주소</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="참여자 이메일 주소"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          createInvitationLink();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={createInvitationLink}
                      disabled={isCreatingInvitation || !email.trim()}
                    >
                      {isCreatingInvitation ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          생성 중...
                        </div>
                      ) : (
                        "초대링크 생성"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 생성된 초대링크 목록 */}
              {invitations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-3">생성된 초대링크</h4>
                  <div className="space-y-3">
                    {invitations.map((invitation, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">
                              {invitation.email}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                invitation.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : invitation.status === "SENT"
                                    ? "bg-blue-100 text-blue-800"
                                    : invitation.status === "OPENED"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {invitation.status === "PENDING"
                                ? "대기중"
                                : invitation.status === "SENT"
                                  ? "전송됨"
                                  : invitation.status === "OPENED"
                                    ? "열림"
                                    : invitation.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            링크: {window.location.origin}/survey/
                            {invitation.uuid}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleCopyLink(invitation.uuid)}
                            variant="outline"
                            size="sm"
                          >
                            복사
                          </Button>
                          <Button
                            onClick={handleDeleteInvitation(invitation.email)}
                            variant="destructive"
                            size="sm"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 초안 상태 안내 */}
        {survey.status === "DRAFT" && (
          <Card className="mt-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">초안 상태</CardTitle>
              <CardDescription className="text-yellow-700">
                이 설문은 아직 초안 상태입니다. 초대링크를 생성하려면 먼저
                설문을 발행해야 합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={publishSurvey}
                disabled={isPublishing}
                variant="outline"
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
              >
                {isPublishing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                    발행 중...
                  </div>
                ) : (
                  "설문 발행하기"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 종료된 설문 안내 */}
        {survey.status === "CLOSED" && (
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">종료된 설문</CardTitle>
              <CardDescription className="text-red-700">
                이 설문은 이미 종료되었습니다. 새로운 참여자를 받을 수 없습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
