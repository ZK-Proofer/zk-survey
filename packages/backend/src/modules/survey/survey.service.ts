import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Survey } from './entity/survey.entity';
import { Question } from './entity/question.entity';
import { QuestionOption } from './entity/question-option.entity';
import { SurveyInvitation } from './entity/survey-invitation.entity';
import { Commitment } from '../auth/entity/commitment.entity';
import { CreateSurveyDto, SurveyResponseDto } from './dto/survey.dto';
import {
  CreateInvitationDto,
  InvitationResponseDto,
  SaveCommitmentDto,
  VerificationResponseDto,
} from './dto/invitation.dto';
import { SurveyStatus } from './const/survey-status.const';
import { InvitationStatus } from './const/invitation-status.const';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private questionOptionRepository: Repository<QuestionOption>,
    @InjectRepository(SurveyInvitation)
    private surveyInvitationRepository: Repository<SurveyInvitation>,
    @InjectRepository(Commitment)
    private commitmentRepository: Repository<Commitment>,
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

    const questions: Question[] = [];
    for (let i = 0; i < createSurveyDto.questions.length; i++) {
      const questionDto = createSurveyDto.questions[i];

      const question = questionRepository.create({
        survey_id: savedSurvey.id,
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

    const response = this.mapToSurveyResponse(savedSurvey, questions);

    return response;
  }

  async getSurveyById(id: number): Promise<SurveyResponseDto> {
    const surveyRepository = this.getSurveyRepository();

    const survey = await surveyRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const questions = await this.questionRepository.find({
      where: { survey_id: id },
      relations: ['options'],
      order: { order_index: 'ASC' },
    });

    return this.mapToSurveyResponse(survey, questions);
  }

  async getSurveyByUuid(uuid: string): Promise<SurveyResponseDto> {
    const invitationRepository = this.getSurveyInvitationRepository();

    const invitation = await invitationRepository.findOne({
      where: { uuid },
      relations: ['survey', 'survey.author'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!invitation.survey) {
      throw new NotFoundException('Survey not found');
    }

    const questions = await this.questionRepository.find({
      where: { survey_id: invitation.survey.id },
      relations: ['options'],
      order: { order_index: 'ASC' },
    });

    return this.mapToSurveyResponse(invitation.survey, questions);
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
      throw new NotFoundException('Survey not found');
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
      throw new NotFoundException('Survey not found');
    }

    await surveyRepository.remove(survey);
  }

  async createInvitation(
    surveyId: number,
    createInvitationDto: CreateInvitationDto,
    authorId: number,
    qr?: QueryRunner,
  ): Promise<InvitationResponseDto> {
    const surveyRepository = this.getSurveyRepository(qr);
    const invitationRepository = this.getSurveyInvitationRepository(qr);

    // 설문이 존재하고 작성자인지 확인
    const survey = await surveyRepository.findOne({
      where: { id: surveyId, author_id: authorId },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    // 설문이 발행된 상태인지 확인
    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new ConflictException(
        'Survey must be active to create invitations',
      );
    }

    // 이미 해당 이메일로 초대가 생성되었는지 확인
    const existingInvitation = await invitationRepository.findOne({
      where: { survey_id: surveyId, email: createInvitationDto.email },
    });

    if (existingInvitation) {
      throw new ConflictException('Invitation already exists for this email');
    }

    // UUID 생성
    let uuid = uuidv4();

    let isInvitationExists = await invitationRepository.exists({
      where: { uuid },
    });

    while (isInvitationExists) {
      uuid = uuidv4();
      isInvitationExists = await invitationRepository.exists({
        where: { uuid },
      });
    }

    // 초대 생성
    const invitation = invitationRepository.create({
      survey_id: surveyId,
      email: createInvitationDto.email,
      uuid: uuid,
      status: InvitationStatus.PENDING,
    });

    const savedInvitation = await invitationRepository.save(invitation);

    return {
      id: savedInvitation.id,
      email: savedInvitation.email,
      uuid: savedInvitation.uuid,
      status: savedInvitation.status,
      created_at: savedInvitation.createdAt,
    };
  }

  async saveCommitment(
    uuid: string,
    saveCommitmentDto: SaveCommitmentDto,
  ): Promise<VerificationResponseDto> {
    const invitationRepository = this.getSurveyInvitationRepository();
    const commitmentRepository = this.getCommitmentRepository();

    const invitation = await invitationRepository.findOne({
      where: { uuid },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Commitment 저장
    const commitment = commitmentRepository.create({
      invitationId: invitation.id,
      uuid: uuid,
      commitmentHash: saveCommitmentDto.commitmentHash,
    });

    await commitmentRepository.save(commitment);

    return {
      success: true,
      message: 'Commitment saved successfully',
    };
  }

  private getSurveyInvitationRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<SurveyInvitation>(SurveyInvitation)
      : this.surveyInvitationRepository;
  }

  private getCommitmentRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<Commitment>(Commitment)
      : this.commitmentRepository;
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
        : null,
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
      created_at: survey.createdAt,
    };
  }
}
