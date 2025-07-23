import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { Verify } from 'src/modules/verify/entity/verify.entity';

@Entity('survey_result')
export class SurveyResult extends BaseEntity {
  @ManyToOne(() => Survey, (survey) => survey.surveyResults, {
    nullable: false,
  })
  @JoinColumn()
  survey: Survey;

  @Column()
  result: string;

  @OneToOne(() => Verify, (verify) => verify.surveyResult)
  verify: Verify;
}
