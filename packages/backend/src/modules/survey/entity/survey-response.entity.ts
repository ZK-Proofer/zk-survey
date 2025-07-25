import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Survey } from './survey.entity';
import { ResponseAnswer } from './response-answer.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('survey_responses')
export class SurveyResponse extends BaseEntity {
  @Column({ name: 'survey_id' })
  survey_id: number;

  @Column({
    name: 'nullifier_hash',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  nullifier_hash: string;

  @ManyToOne(() => Survey)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => ResponseAnswer, (answer) => answer.response)
  answers: ResponseAnswer[];
}
