import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import { SurveyResult } from 'src/modules/survey/entity/survey-result.entity';

@Entity('verify')
export class Verify extends BaseEntity {
  @Column()
  nullifier: string;

  @OneToOne(() => SurveyResult, (surveyResult) => surveyResult.verify, {
    nullable: false,
  })
  @JoinColumn()
  surveyResult: SurveyResult;
}
