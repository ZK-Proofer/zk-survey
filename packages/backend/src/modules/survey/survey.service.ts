import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Survey } from './entity/survey.entity';
import { Question } from './entity/question.entity';
import { QuestionOption } from './entity/question-option.entity';
import { SurveyInvitation } from './entity/survey-invitation.entity';
import { CreateSurveyDto, SurveyResponseDto } from './dto/survey.dto';
import { SurveyStatus } from './const/survey-status.const';
import { QuestionType } from './const/question-type.const';
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

    // Reload survey with author relation
    const surveyWithAuthor = await surveyRepository.findOne({
      where: { id: savedSurvey.id },
      relations: ['author'],
    });

    if (!surveyWithAuthor) {
      throw new Error('Failed to create survey');
    }

    if (!surveyWithAuthor.author) {
      throw new Error('Survey author relation is not loaded');
    }

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

      if (
        (questionDto.type === QuestionType.SINGLE_CHOICE ||
          questionDto.type === QuestionType.MULTIPLE_CHOICE) &&
        questionDto.options
      ) {
        console.log(
          `Creating options for question ${savedQuestion.id}:`,
          questionDto.options,
        );
        const options: QuestionOption[] = [];
        for (let j = 0; j < questionDto.options.length; j++) {
          const optionDto = questionDto.options[j];

          const option = questionOptionRepository.create({
            question_id: savedQuestion.id,
            text: optionDto.text,
            order_index: optionDto.order_index ?? j,
          });

          const savedOption = await questionOptionRepository.save(option);
          console.log(`Saved option:`, savedOption);
          options.push(savedOption);
        }
        savedQuestion.options = options;
      }

      questions.push(savedQuestion);
    }

    // Create invitation for the survey
    const invitation = this.surveyInvitationRepository.create({
      survey_id: savedSurvey.id,
      email: 'anonymous@example.com', // Placeholder email
      uuid: uuidv4(),
      status: InvitationStatus.PENDING,
    });

    const savedInvitation =
      await this.surveyInvitationRepository.save(invitation);

    // Get invitation info for response
    const invitationInfo = {
      uuid: savedInvitation.uuid,
      status: savedInvitation.status,
    };

    const response = this.mapToSurveyResponse(surveyWithAuthor, questions);
    response.invitation = invitationInfo;

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

  private mapToSurveyResponse(
    survey: Survey,
    questions: Question[],
  ): SurveyResponseDto {
    // Check if author relation is loaded
    if (!survey.author) {
      throw new Error('Survey author relation is not loaded');
    }

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      author: {
        id: survey.author.id,
        nickname: survey.author.nickname,
      },
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
