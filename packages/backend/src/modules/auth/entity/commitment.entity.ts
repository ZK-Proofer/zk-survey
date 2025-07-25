import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyInvitation } from 'src/modules/survey/entity/survey-invitation.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('commitments')
export class Commitment extends BaseEntity {
  @Column({ name: 'invitation_id' })
  invitationId: number;

  @Column({ type: 'varchar', length: 36 })
  uuid: string;

  @Column({
    name: 'commitment_hash',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  commitmentHash: string;

  @ManyToOne(() => SurveyInvitation)
  @JoinColumn({ name: 'invitation_id' })
  invitation: SurveyInvitation;
}
