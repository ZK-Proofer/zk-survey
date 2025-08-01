import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../entity/survey.entity';
import { SurveyResponse } from '../entity/survey-response.entity';
import { ResponseAnswer } from '../entity/response-answer.entity';
import { SurveyNotFoundException } from '../exceptions/survey.exception';

export interface QuestionStats {
  questionId: number;
  questionText: string;
  questionType: string;
  totalAnswers: number;
  answers: Array<{
    answerText: string | null;
    selectedOptionId: number | null;
    ratingValue: number | null;
    createdAt: Date;
  }>;
  optionStats?: Array<{
    optionId: number;
    optionText: string;
    count: number;
  }>;
  ratingStats?: Array<{
    rating: number;
    count: number;
  }>;
}

export interface SurveyResult {
  survey: {
    id: number;
    title: string;
    description: string;
    status: string;
    totalResponses: number;
  };
  questionStats: QuestionStats[];
  responses: Array<{
    id: number;
    nullifierHash: string;
    createdAt: Date;
    answers: Array<{
      questionId: number;
      answerText: string | null;
      selectedOptionId: number | null;
      ratingValue: number | null;
    }>;
  }>;
}

@Injectable()
export class SurveyResultService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(ResponseAnswer)
    private responseAnswerRepository: Repository<ResponseAnswer>,
  ) {}

  async getSurveyResults(id: number, authorId: number): Promise<SurveyResult> {
    // 설문이 존재하고 작성자인지 확인
    const survey = await this.surveyRepository.findOne({
      where: { id, author_id: authorId },
      relations: ['questions', 'questions.options'],
    });

    if (!survey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    // 설문 응답들 가져오기
    const responses = await this.surveyResponseRepository.find({
      where: { survey_id: id },
      relations: ['answers'],
      order: { createdAt: 'DESC' },
    });

    // 각 질문별 통계 계산
    const questionStats = survey.questions.map((question) => {
      const answers = responses.flatMap((response) =>
        response.answers.filter((answer) => answer.question_id === question.id),
      );

      const stats: QuestionStats = {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: answers.length,
        answers: answers.map((answer) => ({
          answerText: answer.answer_text,
          selectedOptionId: answer.selected_option_id,
          ratingValue: answer.rating_value,
          createdAt: answer.createdAt,
        })),
      };

      // 질문 유형별 통계 계산
      if (question.type === 'SINGLE_CHOICE' && question.options) {
        stats.optionStats = question.options.map((option) => ({
          optionId: option.id,
          optionText: option.text,
          count: answers.filter(
            (answer) => answer.selected_option_id === option.id,
          ).length,
        }));
      } else if (question.type === 'MULTIPLE_CHOICE' && question.options) {
        stats.optionStats = question.options.map((option) => ({
          optionId: option.id,
          optionText: option.text,
          count: answers.filter(
            (answer) =>
              answer.answer_text && answer.answer_text.includes(option.text),
          ).length,
        }));
      } else if (question.type === 'RATING') {
        stats.ratingStats = [1, 2, 3, 4, 5].map((rating) => ({
          rating,
          count: answers.filter((answer) => answer.rating_value === rating)
            .length,
        }));
      }

      return stats;
    });

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        totalResponses: responses.length,
      },
      questionStats,
      responses: responses.map((response) => ({
        id: response.id,
        nullifierHash: response.nullifier_hash,
        createdAt: response.createdAt,
        answers: response.answers.map((answer) => ({
          questionId: answer.question_id,
          answerText: answer.answer_text,
          selectedOptionId: answer.selected_option_id,
          ratingValue: answer.rating_value,
        })),
      })),
    };
  }
}
