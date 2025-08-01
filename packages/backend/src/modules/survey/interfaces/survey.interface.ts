export interface CreateSurveyRequest {
  title: string;
  description?: string;
  questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  text: string;
  type: 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING';
  order_index?: number;
  is_required?: boolean;
  options?: CreateQuestionOptionRequest[];
}

export interface CreateQuestionOptionRequest {
  text: string;
  order_index?: number;
}

export interface SurveyResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  author?: {
    nickname: string;
  };
  questions: QuestionResponse[];
  invitations: InvitationResponse[];
  created_at: Date;
}

export interface QuestionResponse {
  id: number;
  text: string;
  type: string;
  order_index: number;
  is_required: boolean;
  options?: QuestionOptionResponse[];
}

export interface QuestionOptionResponse {
  id: number;
  text: string;
  order_index: number;
}

export interface InvitationResponse {
  id: number;
  email: string;
  uuid: string;
  status: string;
  created_at: Date;
}

export interface SubmitSurveyRequest {
  commitmentHash: string;
  proof: string;
  nullifier: string;
  answers: SubmitAnswerRequest[];
  resultLink: string;
}

export interface SubmitAnswerRequest {
  questionId: number;
  answer: string;
  selected_option_id?: number;
  rating_value?: number;
}

export interface CreateInvitationRequest {
  email: string;
}

export interface SaveCommitmentRequest {
  commitmentHash: string;
}

export interface VerifyCommitmentRequest {
  commitmentHash: string;
}
