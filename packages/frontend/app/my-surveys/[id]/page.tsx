"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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

      // TODO: 백엔드 API가 준비되면 실제 API 호출로 변경
      // const response = await fetch(
      //   `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${surveyId}/invitation`,
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${token}`,
      //     },
      //     body: JSON.stringify({ email: email.trim() }),
      //   }
      // );

      // if (!response.ok) {
      //   throw new Error("Failed to create invitation");
      // }

      // const data = await response.json();
      // const newInvitation = {
      //   email: email.trim(),
      //   uuid: data.uuid,
      //   status: data.status
      // };
      // setInvitations(prev => [...prev, newInvitation]);

      // 임시로 UUID 생성 (실제로는 백엔드에서 생성)
      const tempUuid = crypto.randomUUID();
      const newInvitation = {
        email: email.trim(),
        uuid: tempUuid,
        status: "PENDING",
      };
      setInvitations((prev) => [...prev, newInvitation]);

      setEmail(""); // 이메일 입력 필드 초기화
    } catch (err) {
      console.error("Failed to create invitation:", err);
      alert("초대링크 생성에 실패했습니다.");
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
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">오류가 발생했습니다</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">
            설문을 찾을 수 없습니다
          </div>
          <Link
            href="/my-surveys"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/my-surveys"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
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
            <div className="flex space-x-2">
              {survey.status === "DRAFT" && (
                <Link
                  href={`/create?edit=${survey.id}`}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  수정
                </Link>
              )}
              {survey.status === "ACTIVE" && (
                <button
                  onClick={closeSurvey}
                  disabled={isClosing}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClosing ? "종료 중..." : "설문 종료"}
                </button>
              )}
              <Link
                href={`/survey/${survey.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                미리보기
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {survey.title}
                </h1>
                <p className="text-gray-600 mb-4">{survey.description}</p>
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
          </div>
        </div>

        {/* 질문 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">질문 목록</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {survey.questions.map((question, index) => (
              <div key={question.id} className="p-6">
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
                    <h3 className="text-lg font-medium text-gray-900">
                      {question.text}
                    </h3>
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
        </div>

        {/* 초대링크 생성 */}
        {survey.status === "ACTIVE" && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              초대링크 생성
            </h3>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                참여자들의 이메일을 입력하여 개별 초대링크를 생성할 수 있습니다.
              </p>

              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="참여자 이메일 주소"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      createInvitationLink();
                    }
                  }}
                />
                <button
                  onClick={createInvitationLink}
                  disabled={isCreatingInvitation || !email.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingInvitation ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      생성 중...
                    </div>
                  ) : (
                    "초대링크 생성"
                  )}
                </button>
              </div>
            </div>

            {/* 생성된 초대링크 목록 */}
            {invitations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  생성된 초대링크
                </h4>
                <div className="space-y-3">
                  {invitations.map((invitation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
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
                          링크: {window.location.origin}/survey/{surveyId}/
                          {invitation.uuid}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCopyLink(invitation.uuid)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          복사
                        </button>
                        <button
                          onClick={handleDeleteInvitation(invitation.email)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 초안 상태 안내 */}
        {survey.status === "DRAFT" && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  초안 상태
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="mb-4">
                    이 설문은 아직 초안 상태입니다. 초대링크를 생성하려면 먼저
                    설문을 발행해야 합니다.
                  </p>
                  <button
                    onClick={publishSurvey}
                    disabled={isPublishing}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPublishing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        발행 중...
                      </div>
                    ) : (
                      "설문 발행하기"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 종료된 설문 안내 */}
        {survey.status === "CLOSED" && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  종료된 설문
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    이 설문은 이미 종료되었습니다. 새로운 참여자를 받을 수
                    없습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
