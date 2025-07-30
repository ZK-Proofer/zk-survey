import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '../const/question-type.const';

export { QuestionType };

export class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @IsOptional()
  order_index?: number;
}

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsNumber()
  @IsOptional()
  order_index?: number;

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];
}

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class SurveyResponseDto {
  id: number;
  title: string;
  description?: string;
  status: string;
  author: {
    nickname: string;
  } | null;
  questions: QuestionResponseDto[];
  created_at: Date;
}

export class QuestionResponseDto {
  id: number;
  text: string;
  type: QuestionType;
  order_index: number;
  is_required: boolean;
  options?: QuestionOptionResponseDto[];
}

export class QuestionOptionResponseDto {
  id: number;
  text: string;
  order_index: number;
}

export class AnswerDto {
  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsNumber()
  @IsOptional()
  selected_option_id?: number;

  @IsNumber()
  @IsOptional()
  rating_value?: number;
}

export class SubmitSurveyDto {
  @IsString()
  @IsNotEmpty()
  commitmentHash: string;

  @IsString()
  @IsNotEmpty()
  proof: string;

  @IsString()
  @IsNotEmpty()
  nullifier: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
