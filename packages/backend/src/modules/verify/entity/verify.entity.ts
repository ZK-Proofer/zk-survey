import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';
import { SurveyResult } from 'src/modules/survey/entity/survey-result.entity';

@Entity('verify')
export class Verify extends BaseEntity {
  @Column()
  nullifier: string;

  @Column()
  surveyResult: SurveyResult;
}
