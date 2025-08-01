"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ZkUtil } from "@/lib/zk";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { SurveyParticipateForm } from "@/components/survey/SurveyParticipateForm";

interface SurveyData {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  author: {
    nickname: string;
  };
}

interface Question {
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
}

interface Answer {
  questionId: number;
  answer?: string;
  selected_option_id?: number;
  rating_value?: number;
}

export default function ParticipateSurvey() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = params.uuid as string;
  const commitmentHash = searchParams.get("hash");

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!commitmentHash) {
      setError("Invalid access. Please use the invitation link.");
      setIsLoading(false);
      return;
    }

    fetchSurveyData();
  }, [uuid, commitmentHash]);

  const fetchSurveyData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/invitation/${uuid}`
      );

      if (response.ok) {
        const data = await response.json();
        setSurvey(data);
      } else {
        const errorData = await response.json();
        if (response.status === 409 && errorData.message?.includes("closed")) {
          throw new Error("이 설문은 이미 종료되어 참여할 수 없습니다.");
        }
        throw new Error("Failed to fetch survey");
      }
    } catch (error) {
      setError("Failed to load survey information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (answers: Answer[], password: string) => {
    if (!survey) {
      throw new Error("Survey not found.");
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

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(errorData.message || "비밀번호가 올바르지 않습니다.");
    }

    const leaves = (await verifyResponse.json()).leaves;

    const { proof, nullifier } = await ZkUtil.generateProof(
      password,
      uuid,
      survey.id,
      leaves
    );

    // 설문 제출
    const submitResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111"}/api/v1/survey/${uuid}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof,
          nullifier,
          answers,
          commitmentHash: newCommitmentHash,
          resultLink: `${window.location.origin}/my-response`,
        }),
      }
    );

    if (submitResponse.ok) {
      alert("설문이 성공적으로 제출되었습니다!");
      router.push(`/survey/${uuid}/complete`);
    } else {
      const errorData = await submitResponse.json();
      if (
        submitResponse.status === 409 &&
        errorData.message?.includes("closed")
      ) {
        throw new Error("이 설문은 이미 종료되어 참여할 수 없습니다.");
      }
      throw new Error(errorData.message || "Failed to submit survey.");
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="설문 정보를 불러오는 중..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="오류가 발생했습니다"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!survey) {
    return (
      <ErrorDisplay
        title="설문을 찾을 수 없습니다"
        message="설문이 존재하지 않거나 접근할 수 없습니다."
        showRetry={false}
      />
    );
  }

  return <SurveyParticipateForm survey={survey} onSubmit={handleSubmit} />;
}
