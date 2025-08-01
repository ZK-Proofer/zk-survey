import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { SurveyResponse } from '../entity/survey-response.entity';
import { ResponseAnswer } from '../entity/response-answer.entity';
import { SurveyInvitation } from '../entity/survey-invitation.entity';
import { Commitment } from '../../auth/entity/commitment.entity';
import {
  AnswerResponseDto,
  SubmitSurveyDto,
  UpdateResponseDto,
} from '../dto/survey.dto';
import { SurveyStatus } from '../const/survey-status.const';
import { VerifyService } from '../../verify/verify.service';
import { MailService } from '../../mail/mail.service';
import {
  SurveyClosedException,
  InvitationNotFoundException,
  CommitmentNotFoundException,
  CommitmentInvalidException,
  ProofVerificationException,
  SurveyResponseNotFoundException,
} from '../exceptions/survey.exception';
import { SubmitSurveyRequest } from '../interfaces/survey.interface';
import { SurveyResponseDto } from '../dto/survey.dto';
@Injectable()
export class SurveyResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(ResponseAnswer)
    private responseAnswerRepository: Repository<ResponseAnswer>,
    @InjectRepository(SurveyInvitation)
    private surveyInvitationRepository: Repository<SurveyInvitation>,
    @InjectRepository(Commitment)
    private commitmentRepository: Repository<Commitment>,
    private verifyService: VerifyService,
    private mailService: MailService,
  ) {}

  private getSurveyResponseRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<SurveyResponse>(SurveyResponse)
      : this.surveyResponseRepository;
  }

  private getResponseAnswerRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ResponseAnswer>(ResponseAnswer)
      : this.responseAnswerRepository;
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

  async submitSurvey(
    uuid: string,
    submitSurveyDto: SubmitSurveyRequest,
    qr?: QueryRunner,
  ): Promise<void> {
    const surveyInvitationRepository = this.getSurveyInvitationRepository(qr);
    const commitmentRepository = this.getCommitmentRepository(qr);
    const surveyResponseRepository = this.getSurveyResponseRepository(qr);
    const responseAnswerRepository = this.getResponseAnswerRepository(qr);

    const surveyInvitation = await surveyInvitationRepository.findOne({
      where: { uuid },
      relations: ['survey', 'survey.merkletree'],
    });

    if (!surveyInvitation) {
      throw new InvitationNotFoundException('Survey invitation not found');
    }

    // 설문이 종료된 상태인지 확인
    if (surveyInvitation.survey.status === SurveyStatus.CLOSED) {
      throw new SurveyClosedException(
        'This survey has been closed and is no longer accepting responses',
      );
    }

    // 커밋먼트 검증
    const commitment = await commitmentRepository.findOne({
      where: { invitationId: surveyInvitation.id },
    });

    if (!commitment) {
      throw new CommitmentNotFoundException('Commitment not found');
    }

    if (commitment.commitmentHash !== submitSurveyDto.commitmentHash) {
      throw new CommitmentInvalidException('Commitment is not valid');
    }

    // Proof 검증
    try {
      await this.verifyService.verify(
        submitSurveyDto.proof,
        surveyInvitation.survey.id,
        submitSurveyDto.nullifier,
      );
    } catch (error) {
      throw new ProofVerificationException(error.message);
    }

    // 설문 응답 저장
    const surveyResponse = new SurveyResponse();
    surveyResponse.survey_id = surveyInvitation.survey.id;
    surveyResponse.nullifier_hash = submitSurveyDto.nullifier;

    const savedResponse = await surveyResponseRepository.save(surveyResponse);

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

    // 설문 완료 메일 발송
    try {
      await this.mailService.sendSurveyCompletionThankYou(
        surveyInvitation.email,
        surveyInvitation.survey.title,
        surveyInvitation.survey.description,
        uuid,
        submitSurveyDto.resultLink,
      );
    } catch (error) {
      // 메일 발송 실패 시에도 설문 제출은 성공으로 처리
      console.error('Failed to send completion email:', error);
    }
  }

  async getSurveyResponses(surveyId: number): Promise<SurveyResponse[]> {
    return await this.surveyResponseRepository.find({
      where: { survey_id: surveyId },
      relations: ['answers'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSurveyResponsesByNullifier(
    nullifier: string,
  ): Promise<AnswerResponseDto[]> {
    const surveyResponse = await this.surveyResponseRepository.findOne({
      where: { nullifier_hash: nullifier },
      relations: ['answers'],
    });

    if (!surveyResponse) {
      throw new SurveyResponseNotFoundException('Survey response not found');
    }

    return surveyResponse.answers.map((answer) => {
      return {
        questionId: answer.question_id,
        answer: answer.answer_text,
        selected_option_id: answer.selected_option_id,
        rating_value: answer.rating_value,
      };
    });
  }

  async updateResponse(
    oldNullifier: string,
    updateResponseDto: UpdateResponseDto,
    qr?: QueryRunner,
  ): Promise<void> {
    const surveyResponseRepository = this.getSurveyResponseRepository(qr);
    const responseAnswerRepository = this.getResponseAnswerRepository(qr);

    const surveyResponse = await surveyResponseRepository.findOne({
      where: { nullifier_hash: oldNullifier },
      relations: ['answers', 'survey'],
    });

    if (!surveyResponse) {
      throw new SurveyResponseNotFoundException('Survey response not found');
    }

    // proof 다시 검증
    try {
      await this.verifyService.verify(
        updateResponseDto.proof,
        surveyResponse.survey.id,
        updateResponseDto.newNullifier,
      );
    } catch (error) {
      throw new ProofVerificationException(error.message);
    }

    surveyResponse.nullifier_hash = updateResponseDto.newNullifier;

    // 기존 답변들을 업데이트
    for (const answer of surveyResponse.answers) {
      const existingAnswer = updateResponseDto.answers.find(
        (a) => a.questionId === answer.question_id,
      );
      if (existingAnswer) {
        answer.answer_text = existingAnswer.answer;
        answer.selected_option_id = existingAnswer.selected_option_id || null;
        answer.rating_value = existingAnswer.rating_value || null;
      }
    }

    // 업데이트된 답변들을 저장
    await responseAnswerRepository.save(surveyResponse.answers);
  }
}
