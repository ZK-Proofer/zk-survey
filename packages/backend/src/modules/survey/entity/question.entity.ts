import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/modules/common/entity/base.entity';
import { QuestionType } from '../const/question-type.const';
import { QuestionOption } from './question-option.entity';
import { Survey } from './survey.entity';

@Entity('questions')
export class Question extends BaseEntity {
  @Column({ name: 'survey_id' })
  survey_id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.TEXT })
  type: QuestionType;

  @Column({ name: 'order_index', default: 0 })
  order_index: number;

  @Column({ name: 'is_required', default: true })
  is_required: boolean;

  @ManyToOne(() => Survey, (survey) => survey.questions)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => QuestionOption, (option) => option.question)
  options: QuestionOption[];
}
