import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { SurveyInvitation } from '../entity/survey-invitation.entity';
import { Survey } from '../entity/survey.entity';
import { Commitment } from '../../auth/entity/commitment.entity';
import {
  CreateInvitationDto,
  InvitationResponseDto,
  SaveCommitmentDto,
  VerificationResponseDto,
  VerifyCommitmentDto,
  VerifyCommitmentResponseDto,
} from '../dto/invitation.dto';
import { SurveyStatus } from '../const/survey-status.const';
import { InvitationStatus } from '../const/invitation-status.const';
import { v4 as uuidv4 } from 'uuid';
import { MerkleTreeService } from '../../merkletree/merkle-tree.service';
import {
  SurveyNotFoundException,
  SurveyClosedException,
  InvitationNotFoundException,
  InvitationAlreadyExistsException,
  CommitmentNotFoundException,
  CommitmentInvalidException,
} from '../exceptions/survey.exception';
import {
  CreateInvitationRequest,
  SaveCommitmentRequest,
  VerifyCommitmentRequest,
} from '../interfaces/survey.interface';

@Injectable()
export class SurveyInvitationService {
  constructor(
    @InjectRepository(SurveyInvitation)
    private surveyInvitationRepository: Repository<SurveyInvitation>,
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(Commitment)
    private commitmentRepository: Repository<Commitment>,
    private merkletreeService: MerkleTreeService,
  ) {}

  private getSurveyInvitationRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<SurveyInvitation>(SurveyInvitation)
      : this.surveyInvitationRepository;
  }

  private getSurveyRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<Survey>(Survey)
      : this.surveyRepository;
  }

  private getCommitmentRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<Commitment>(Commitment)
      : this.commitmentRepository;
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
      throw new SurveyNotFoundException('Survey not found');
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
      throw new InvitationAlreadyExistsException(
        'Invitation already exists for this email',
      );
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

  async getSurveyByUuid(uuid: string): Promise<Survey> {
    const invitationRepository = this.getSurveyInvitationRepository();

    const invitation = await invitationRepository.findOne({
      where: { uuid },
      relations: ['survey', 'survey.author'],
    });

    if (!invitation) {
      throw new InvitationNotFoundException('Invitation not found');
    }

    if (!invitation.survey) {
      throw new SurveyNotFoundException('Survey not found');
    }

    // 설문이 종료된 상태인지 확인
    if (invitation.survey.status === SurveyStatus.CLOSED) {
      throw new SurveyClosedException(
        'This survey has been closed and is no longer accepting responses',
      );
    }

    return invitation.survey;
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
      throw new InvitationNotFoundException('Invitation not found');
    }

    const existingCommitment = await commitmentRepository.findOne({
      where: { invitationId: invitation.id },
    });

    if (
      existingCommitment &&
      saveCommitmentDto.commitmentHash !== existingCommitment.commitmentHash
    ) {
      throw new CommitmentInvalidException('Password is not valid');
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
      throw new InvitationNotFoundException('Invitation not found');
    }

    if (!invitation.survey.merkletree) {
      throw new SurveyNotFoundException('Merkle tree not found');
    }

    const commitment = await commitmentRepository.findOne({
      where: { invitationId: invitation.id },
    });

    if (!commitment) {
      throw new CommitmentNotFoundException('Commitment not found');
    }

    if (commitment.commitmentHash !== verifyCommitmentDto.commitmentHash) {
      throw new CommitmentInvalidException('Commitment is not valid');
    }

    return {
      success: true,
      leaves: JSON.parse(invitation.survey.merkletree.leaves),
    };
  }
}
