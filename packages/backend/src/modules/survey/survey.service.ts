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
import {
  CreateSurveyDto,
  SubmitSurveyDto,
  SurveyResponseDto,
} from './dto/survey.dto';
import {
  CreateInvitationDto,
  InvitationResponseDto,
  SaveCommitmentDto,
  VerificationResponseDto,
  VerifyCommitmentDto,
  VerifyCommitmentResponseDto,
} from './dto/invitation.dto';
import { SurveyStatus } from './const/survey-status.const';
import { InvitationStatus } from './const/invitation-status.const';
import { v4 as uuidv4 } from 'uuid';
import { MerkleTreeResponseDto } from './dto/merkle-tree.dto';
import { MerkleTreeService } from '../merkletree/merkletree.service';
import { VerifyService } from '../verify/verify.service';
import { SurveyResponse } from './entity/survey-response.entity';
import { ResponseAnswer } from './entity/response-answer.entity';
import { Verification } from '../verify/entity/verification.entity';
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
    private merkletreeService: MerkleTreeService,
    private verifyService: VerifyService,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(ResponseAnswer)
    private responseAnswerRepository: Repository<ResponseAnswer>,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
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

    await this.merkletreeService.createTree(savedSurvey.id, 10, qr);
    const response = this.mapToSurveyResponse(savedSurvey, questions);

    return response;
  }

  async getSurveyById(id: number): Promise<SurveyResponseDto> {
    const surveyRepository = this.getSurveyRepository();

    const survey = await surveyRepository.findOne({
      where: { id },
      relations: ['author', 'invitations'],
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

  async getSurveyPreview(id: number): Promise<SurveyResponseDto> {
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

    // 설문이 종료된 상태인지 확인
    if (invitation.survey.status === SurveyStatus.CLOSED) {
      throw new ConflictException(
        'This survey has been closed and is no longer accepting responses',
      );
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
    qr?: QueryRunner,
  ): Promise<VerificationResponseDto> {
    const invitationRepository = this.getSurveyInvitationRepository(qr);
    const commitmentRepository = this.getCommitmentRepository(qr);

    const invitation = await invitationRepository.findOne({
      where: { uuid },
      relations: ['survey'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const existingCommitment = await commitmentRepository.findOne({
      where: { invitationId: invitation.id },
    });

    if (
      existingCommitment &&
      saveCommitmentDto.commitmentHash !== existingCommitment.commitmentHash
    ) {
      throw new ConflictException('Password is not valid');
    }

    if (existingCommitment) {
      return {
        success: true,
        message: 'Commitment already exists',
      };
    }

    // Commitment 저장
    const commitment = commitmentRepository.create({
      invitationId: invitation.id,
      uuid: uuid,
      commitmentHash: saveCommitmentDto.commitmentHash,
    });

    await commitmentRepository.save(commitment);

    await this.merkletreeService.addLeaf(
      invitation.survey.id,
      saveCommitmentDto.commitmentHash,
      qr,
    );

    return {
      success: true,
      message: 'Commitment saved successfully',
    };
  }

  async verifyCommitment(
    uuid: string,
    verifyCommitmentDto: VerifyCommitmentDto,
  ): Promise<VerifyCommitmentResponseDto> {
    const invitationRepository = this.getSurveyInvitationRepository();
    const commitmentRepository = this.getCommitmentRepository();

    const invitation = await invitationRepository.findOne({
      where: { uuid },
      relations: ['survey', 'survey.merkletree'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!invitation.survey.merkletree) {
      throw new NotFoundException('Merkle tree not found');
    }

    const commitment = await commitmentRepository.findOne({
      where: { invitationId: invitation.id },
    });

    if (!commitment) {
      throw new NotFoundException('Commitment not found');
    }

    if (commitment.commitmentHash !== verifyCommitmentDto.commitmentHash) {
      throw new ConflictException('Commitment is not valid');
    }

    return {
      success: true,
      leaves: JSON.parse(invitation.survey.merkletree.leaves),
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

  async submitSurvey(
    uuid: string,
    submitSurveyDto: SubmitSurveyDto,
    qr?: QueryRunner,
  ): Promise<void> {
    const surveyInvitationRepository = this.getSurveyInvitationRepository(qr);
    const commitmentRepository = this.getCommitmentRepository(qr);
    const verificationRepository = qr
      ? qr.manager.getRepository<Verification>(Verification)
      : this.verificationRepository;
    const surveyResponseRepository = qr
      ? qr.manager.getRepository<SurveyResponse>(SurveyResponse)
      : this.surveyResponseRepository;
    const responseAnswerRepository = qr
      ? qr.manager.getRepository<ResponseAnswer>(ResponseAnswer)
      : this.responseAnswerRepository;

    const surveyInvitation = await surveyInvitationRepository.findOne({
      where: { uuid },
      relations: ['survey', 'survey.merkletree'],
    });

    if (!surveyInvitation) {
      throw new NotFoundException('Survey invitation not found');
    }

    // 설문이 종료된 상태인지 확인
    if (surveyInvitation.survey.status === SurveyStatus.CLOSED) {
      throw new ConflictException(
        'This survey has been closed and is no longer accepting responses',
      );
    }

    // 커밋먼트 검증
    const commitment = await commitmentRepository.findOne({
      where: { invitationId: surveyInvitation.id },
    });

    if (!commitment) {
      throw new NotFoundException('Commitment not found');
    }

    if (commitment.commitmentHash !== submitSurveyDto.commitmentHash) {
      throw new ConflictException('Commitment is not valid');
    }

    // Proof 검증
    try {
      await this.verifyService.verify(
        submitSurveyDto.proof,
        surveyInvitation.survey.id,
        submitSurveyDto.nullifier,
      );
    } catch (error) {
      throw new ConflictException(error.message);
    }
    const verification = new Verification();
    verification.nullifier_hash = submitSurveyDto.nullifier;

    // 설문 응답 저장
    const surveyResponse = new SurveyResponse();
    surveyResponse.survey_id = surveyInvitation.survey.id;
    surveyResponse.nullifier_hash = submitSurveyDto.nullifier;

    const savedResponse = await surveyResponseRepository.save(surveyResponse);

    verification.response_id = savedResponse.id;
    await verificationRepository.save(verification);

    // 답변들 저장
    const answers = submitSurveyDto.answers.map((answerDto) => {
      const answer = new ResponseAnswer();
      answer.response_id = savedResponse.id;
      answer.question_id = answerDto.questionId;
      answer.answer_text = answerDto.answer;
      answer.selected_option_id = answerDto.selected_option_id || null;
      answer.rating_value = answerDto.rating_value || null;
      return answer;
    });

    await responseAnswerRepository.save(answers);
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
      throw new NotFoundException('Survey not found');
    }

    // 설문이 발행된 상태라면 수정 불가
    if (existingSurvey.status === SurveyStatus.ACTIVE) {
      throw new ConflictException('Cannot update an active survey');
    }

    // 설문 기본 정보 업데이트
    existingSurvey.title = updateSurveyDto.title;
    existingSurvey.description = updateSurveyDto.description || '';
    await surveyRepository.save(existingSurvey);

    // 기존 질문들 삭제
    await questionRepository.delete({ survey_id: id });

    // 새로운 질문들 생성
    const questions: Question[] = [];
    for (let i = 0; i < updateSurveyDto.questions.length; i++) {
      const questionDto = updateSurveyDto.questions[i];

      const question = questionRepository.create({
        survey_id: id,
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

    return this.mapToSurveyResponse(existingSurvey, questions);
  }

  async getSurveyResults(id: number, authorId: number): Promise<any> {
    const surveyRepository = this.getSurveyRepository();
    const surveyResponseRepository = this.surveyResponseRepository;
    const responseAnswerRepository = this.responseAnswerRepository;

    // 설문이 존재하고 작성자인지 확인
    const survey = await surveyRepository.findOne({
      where: { id, author_id: authorId },
      relations: ['questions', 'questions.options'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    // 설문 응답들 가져오기
    const responses = await surveyResponseRepository.find({
      where: { survey_id: id },
      relations: ['answers'],
      order: { createdAt: 'DESC' },
    });

    // 각 질문별 통계 계산
    const questionStats = survey.questions.map((question) => {
      const answers = responses.flatMap((response) =>
        response.answers.filter((answer) => answer.question_id === question.id),
      );

      let stats: any = {
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
        const optionStats = question.options.map((option) => ({
          optionId: option.id,
          optionText: option.text,
          count: answers.filter(
            (answer) => answer.selected_option_id === option.id,
          ).length,
        }));
        stats.optionStats = optionStats;
      } else if (question.type === 'MULTIPLE_CHOICE' && question.options) {
        const optionStats = question.options.map((option) => ({
          optionId: option.id,
          optionText: option.text,
          count: answers.filter(
            (answer) =>
              answer.answer_text && answer.answer_text.includes(option.text),
          ).length,
        }));
        stats.optionStats = optionStats;
      } else if (question.type === 'RATING') {
        const ratingStats = [1, 2, 3, 4, 5].map((rating) => ({
          rating,
          count: answers.filter((answer) => answer.rating_value === rating)
            .length,
        }));
        stats.ratingStats = ratingStats;
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
