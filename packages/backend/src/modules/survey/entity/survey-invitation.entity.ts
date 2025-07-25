import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { InvitationStatus } from '../const/invitation-status.const';
import { BaseEntity } from 'src/modules/common/entity/base.entity';

@Entity('survey_invitations')
export class SurveyInvitation extends BaseEntity {
  @Column({ name: 'survey_id' })
  survey_id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: 'sent_at', nullable: true })
  sent_at: Date;

  @Column({ name: 'opened_at', nullable: true })
  opened_at: Date;

  @ManyToOne(() => Survey)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;
}
