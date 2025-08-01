import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Survey } from './entity/survey.entity';
import { Question } from './entity/question.entity';
import { QuestionOption } from './entity/question-option.entity';
import {
  CreateSurveyDto,
  SurveyResponseDto,
  AnswerResponseDto,
  UpdateResponseDto,
} from './dto/survey.dto';
import { SurveyStatus } from './const/survey-status.const';
import { MerkleTreeService } from '../merkletree/merkle-tree.service';
import { SurveyInvitationService } from './services/survey-invitation.service';
import { SurveyResponseService } from './services/survey-response.service';
import { SurveyResultService } from './services/survey-result.service';
import {
  SurveyNotFoundException,
  SurveyActiveException,
} from './exceptions/survey.exception';
import {
  CreateSurveyRequest,
  SubmitSurveyRequest,
  CreateInvitationRequest,
  SaveCommitmentRequest,
  VerifyCommitmentRequest,
} from './interfaces/survey.interface';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private questionOptionRepository: Repository<QuestionOption>,
    private merkletreeService: MerkleTreeService,
    private surveyInvitationService: SurveyInvitationService,
    private surveyResponseService: SurveyResponseService,
    private surveyResultService: SurveyResultService,
  ) {}

  private getSurveyRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<Survey>(Survey)
      : this.surveyRepository;
  }

  private getQuestionRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<Question>(Question)
      : this.questionRepository;
  }

  private getQuestionOptionRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<QuestionOption>(QuestionOption)
      : this.questionOptionRepository;
  }

  async createSurvey(
    createSurveyDto: CreateSurveyDto,
    authorId: number,
    qr?: QueryRunner,
  ): Promise<SurveyResponseDto> {
    const surveyRepository = this.getSurveyRepository(qr);
    const questionRepository = this.getQuestionRepository(qr);
    const questionOptionRepository = this.getQuestionOptionRepository(qr);

    const survey = surveyRepository.create({
      title: createSurveyDto.title,
      description: createSurveyDto.description,
      status: SurveyStatus.DRAFT,
      author_id: authorId,
    });

    const savedSurvey = await surveyRepository.save(survey);

    const questions = await this.createQuestions(
      savedSurvey.id,
      createSurveyDto.questions,
      questionRepository,
      questionOptionRepository,
    );

    await this.merkletreeService.createTree(savedSurvey.id, 10, qr);

    return this.mapToSurveyResponse(savedSurvey, questions);
  }

  async getSurveyById(id: number): Promise<SurveyResponseDto> {
    const surveyRepository = this.getSurveyRepository();

    const survey = await surveyRepository.findOne({
      where: { id },
      relations: ['author', 'invitations'],
    });

    if (!survey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    const questions = await this.questionRepository.find({
      where: { survey_id: id },
      relations: ['options'],
      order: { order_index: 'ASC' },
    });

    return this.mapToSurveyResponse(survey, questions);
  }

  async getSurveyPreview(id: number): Promise<SurveyResponseDto> {
    const surveyRepository = this.getSurveyRepository();

    const survey = await surveyRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!survey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    const questions = await this.questionRepository.find({
      where: { survey_id: id },
      relations: ['options'],
      order: { order_index: 'ASC' },
    });

    return this.mapToSurveyResponse(survey, questions);
  }

  async getSurveyByUuid(uuid: string): Promise<SurveyResponseDto> {
    const survey = await this.surveyInvitationService.getSurveyByUuid(uuid);

    const questions = await this.questionRepository.find({
      where: { survey_id: survey.id },
      relations: ['options'],
      order: { order_index: 'ASC' },
    });

    return this.mapToSurveyResponse(survey, questions);
  }

  async getSurveysByAuthor(authorId: number): Promise<SurveyResponseDto[]> {
    const surveyRepository = this.getSurveyRepository();

    const surveys = await surveyRepository.find({
      where: { author_id: authorId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    const result: SurveyResponseDto[] = [];
    for (const survey of surveys) {
      const questions = await this.questionRepository.find({
        where: { survey_id: survey.id },
        relations: ['options'],
        order: { order_index: 'ASC' },
      });

      result.push(this.mapToSurveyResponse(survey, questions));
    }

    return result;
  }

  async updateSurveyStatus(
    id: number,
    status: SurveyStatus,
    authorId: number,
    qr?: QueryRunner,
  ): Promise<void> {
    const surveyRepository = this.getSurveyRepository(qr);

    const survey = await surveyRepository.findOne({
      where: { id, author_id: authorId },
    });

    if (!survey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    survey.status = status;
    await surveyRepository.save(survey);
  }

  async deleteSurvey(
    id: number,
    authorId: number,
    qr?: QueryRunner,
  ): Promise<void> {
    const surveyRepository = this.getSurveyRepository(qr);

    const survey = await surveyRepository.findOne({
      where: { id, author_id: authorId },
    });

    if (!survey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    await surveyRepository.remove(survey);
  }

  async updateSurvey(
    id: number,
    updateSurveyDto: CreateSurveyDto,
    authorId: number,
    qr?: QueryRunner,
  ): Promise<SurveyResponseDto> {
    const surveyRepository = this.getSurveyRepository(qr);
    const questionRepository = this.getQuestionRepository(qr);
    const questionOptionRepository = this.getQuestionOptionRepository(qr);

    // 설문이 존재하고 작성자인지 확인
    const existingSurvey = await surveyRepository.findOne({
      where: { id, author_id: authorId },
    });

    if (!existingSurvey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    // 설문이 발행된 상태라면 수정 불가
    if (existingSurvey.status === SurveyStatus.ACTIVE) {
      throw new SurveyActiveException('Cannot update an active survey');
    }

    // 설문 기본 정보 업데이트
    existingSurvey.title = updateSurveyDto.title;
    existingSurvey.description = updateSurveyDto.description || '';
    await surveyRepository.save(existingSurvey);

    // 기존 질문들 삭제
    await questionRepository.delete({ survey_id: id });

    // 새로운 질문들 생성
    const questions = await this.createQuestions(
      id,
      updateSurveyDto.questions,
      questionRepository,
      questionOptionRepository,
    );

    return this.mapToSurveyResponse(existingSurvey, questions);
  }

  // 초대 관련 메서드들 - SurveyInvitationService로 위임
  async createInvitation(
    surveyId: number,
    createInvitationDto: CreateInvitationRequest,
    authorId: number,
    qr?: QueryRunner,
  ) {
    return await this.surveyInvitationService.createInvitation(
      surveyId,
      createInvitationDto,
      authorId,
      qr,
    );
  }

  async saveCommitment(
    uuid: string,
    saveCommitmentDto: SaveCommitmentRequest,
    qr?: QueryRunner,
  ) {
    return await this.surveyInvitationService.saveCommitment(
      uuid,
      saveCommitmentDto,
      qr,
    );
  }

  async verifyCommitment(
    uuid: string,
    verifyCommitmentDto: VerifyCommitmentRequest,
  ) {
    return await this.surveyInvitationService.verifyCommitment(
      uuid,
      verifyCommitmentDto,
    );
  }

  // 응답 관련 메서드들 - SurveyResponseService로 위임
  async submitSurvey(
    uuid: string,
    submitSurveyDto: SubmitSurveyRequest,
    qr?: QueryRunner,
  ) {
    return await this.surveyResponseService.submitSurvey(
      uuid,
      submitSurveyDto,
      qr,
    );
  }

  // 결과 관련 메서드들 - SurveyResultService로 위임
  async getSurveyResults(id: number, authorId: number) {
    return await this.surveyResultService.getSurveyResults(id, authorId);
  }

  async getResponseByNullifier(
    nullifier: string,
  ): Promise<AnswerResponseDto[]> {
    const surveyResponse =
      await this.surveyResponseService.getSurveyResponsesByNullifier(nullifier);

    return surveyResponse;
  }

  async updateResponse(
    nullifier: string,
    updateResponseDto: UpdateResponseDto,
    qr?: QueryRunner,
  ): Promise<void> {
    return await this.surveyResponseService.updateResponse(
      nullifier,
      updateResponseDto,
      qr,
    );
  }
  // 헬퍼 메서드들
  private async createQuestions(
    surveyId: number,
    questionDtos: any[],
    questionRepository: Repository<Question>,
    questionOptionRepository: Repository<QuestionOption>,
  ): Promise<Question[]> {
    const questions: Question[] = [];

    for (let i = 0; i < questionDtos.length; i++) {
      const questionDto = questionDtos[i];

      const question = questionRepository.create({
        survey_id: surveyId,
        text: questionDto.text,
        type: questionDto.type,
        order_index: questionDto.order_index ?? i,
        is_required: questionDto.is_required ?? true,
      });

      const savedQuestion = await questionRepository.save(question);

      if (questionDto.options && questionDto.options.length > 0) {
        const options: QuestionOption[] = [];
        for (let j = 0; j < questionDto.options.length; j++) {
          const optionDto = questionDto.options[j];

          const option = questionOptionRepository.create({
            question_id: savedQuestion.id,
            text: optionDto.text,
            order_index: optionDto.order_index ?? j,
          });

          const savedOption = await questionOptionRepository.save(option);
          options.push(savedOption);
        }
        savedQuestion.options = options;
      }

      questions.push(savedQuestion);
    }

    return questions;
  }

  private mapToSurveyResponse(
    survey: Survey,
    questions: Question[],
  ): SurveyResponseDto {
    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      author: survey.author
        ? {
            nickname: survey.author.nickname,
          }
        : undefined,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        order_index: q.order_index,
        is_required: q.is_required,
        options: q.options?.map((o) => ({
          id: o.id,
          text: o.text,
          order_index: o.order_index,
        })),
      })),
      invitations:
        survey.invitations?.map((i) => ({
          id: i.id,
          email: i.email,
          uuid: i.uuid,
          status: i.status,
          created_at: i.createdAt,
        })) ?? [],
      created_at: survey.createdAt,
    };
  }
}
