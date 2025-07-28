const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9111";

export interface Survey {
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

export interface CreateSurveyDto {
  title: string;
  description: string;
  questions: Array<{
    text: string;
    type: string;
    order_index: number;
    is_required: boolean;
    options?: Array<{
      text: string;
      order_index: number;
    }>;
  }>;
}

export interface CreateInvitationDto {
  email: string;
}

export interface InvitationResponse {
  id: number;
  email: string;
  uuid: string;
  status: string;
  created_at: Date;
}

export interface VerifyCommitmentDto {
  commitmentHash: string;
}

export interface VerificationResponse {
  success: boolean;
  message?: string;
}

export class SurveyService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async createSurvey(surveyData: CreateSurveyDto): Promise<Survey> {
    const response = await fetch(`${BACKEND_URL}/api/v1/survey`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(surveyData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create survey");
    }

    return response.json();
  }

  static async getMySurveys(): Promise<Survey[]> {
    const response = await fetch(`${BACKEND_URL}/api/v1/survey`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch surveys");
    }

    return response.json();
  }

  static async getSurveyById(id: number): Promise<Survey> {
    const response = await fetch(`${BACKEND_URL}/api/v1/survey/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch survey");
    }

    return response.json();
  }

  static async getSurveyByUuid(uuid: string): Promise<Survey> {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/survey/invitation/${uuid}`
    );

    if (!response.ok) {
      throw new Error("Invalid invitation link");
    }

    return response.json();
  }

  static async updateSurveyStatus(id: number, status: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/v1/survey/${id}/status`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update survey status");
    }
  }

  static async createInvitation(
    surveyId: number,
    email: string
  ): Promise<InvitationResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/survey/${surveyId}/invitation`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create invitation");
    }

    return response.json();
  }

  static async verifyCommitment(
    uuid: string,
    commitmentHash: string
  ): Promise<VerificationResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/survey/invitation/${uuid}/commitment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commitmentHash }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Invalid commitment");
    }

    return response.json();
  }
}
