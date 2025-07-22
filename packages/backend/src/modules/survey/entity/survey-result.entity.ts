import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('survey_result')
export class SurveyResult extends BaseEntity {
  @Column()
  surveyId: number;

  @Column()
  result: string;
}
