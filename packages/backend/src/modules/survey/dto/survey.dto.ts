import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  TEXT = 'TEXT',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  RATING = 'RATING',
}

export class CreateQuestionOptionDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

export class CreateSurveyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class SubmitAnswerDto {
  @IsNumber()
  questionId: number;

  @IsString()
  answer: string;

  @IsOptional()
  @IsNumber()
  selected_option_id?: number;

  @IsOptional()
  @IsNumber()
  rating_value?: number;
}

export class SubmitSurveyDto {
  @IsString()
  commitmentHash: string;

  @IsString()
  proof: string;

  @IsString()
  nullifier: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}

export class SurveyResponseDto {
  id: number;
  title: string;
  description: string;
  status: string;
  author?: {
    nickname: string;
  };
  questions: QuestionResponseDto[];
  invitations: InvitationResponseDto[];
  created_at: Date;
}

export class QuestionResponseDto {
  id: number;
  text: string;
  type: string;
  order_index: number;
  is_required: boolean;
  options?: QuestionOptionResponseDto[];
}

export class QuestionOptionResponseDto {
  id: number;
  text: string;
  order_index: number;
}

export class InvitationResponseDto {
  id: number;
  email: string;
  uuid: string;
  status: string;
  created_at: Date;
}
