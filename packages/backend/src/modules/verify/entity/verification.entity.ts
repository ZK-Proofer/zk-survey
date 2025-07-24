import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyResponse } from '../../survey/entity/survey-response.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('verifications')
export class Verification extends BaseEntity {
  @Column({ name: 'response_id' })
  response_id: number;

  @Column({ name: 'nullifier_hash', type: 'varchar', length: 255 })
  nullifier_hash: string;

  @ManyToOne(() => SurveyResponse)
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;
}
