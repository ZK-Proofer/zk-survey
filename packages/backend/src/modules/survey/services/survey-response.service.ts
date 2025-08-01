import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { SurveyResponse } from '../entity/survey-response.entity';
import { ResponseAnswer } from '../entity/response-answer.entity';
import { SurveyInvitation } from '../entity/survey-invitation.entity';
import { Commitment } from '../../auth/entity/commitment.entity';
import { Verification } from '../../verify/entity/verification.entity';
import { SubmitSurveyDto } from '../dto/survey.dto';
import { SurveyStatus } from '../const/survey-status.const';
import { VerifyService } from '../../verify/verify.service';
import {
  SurveyClosedException,
  InvitationNotFoundException,
  CommitmentNotFoundException,
  CommitmentInvalidException,
  ProofVerificationException,
} from '../exceptions/survey.exception';
import { SubmitSurveyRequest } from '../interfaces/survey.interface';

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
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    private verifyService: VerifyService,
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

  private getVerificationRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<Verification>(Verification)
      : this.verificationRepository;
  }

  async submitSurvey(
    uuid: string,
    submitSurveyDto: SubmitSurveyDto,
    qr?: QueryRunner,
  ): Promise<void> {
    const surveyInvitationRepository = this.getSurveyInvitationRepository(qr);
    const commitmentRepository = this.getCommitmentRepository(qr);
    const verificationRepository = this.getVerificationRepository(qr);
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

  async getSurveyResponses(surveyId: number): Promise<SurveyResponse[]> {
    return await this.surveyResponseRepository.find({
      where: { survey_id: surveyId },
      relations: ['answers'],
      order: { createdAt: 'DESC' },
    });
  }
}
