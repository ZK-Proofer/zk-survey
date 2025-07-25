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
    id: number;
    nickname: string;
  };
  questions: QuestionResponseDto[];
  created_at: Date;
  invitation?: {
    uuid: string;
    status: string;
  };
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
