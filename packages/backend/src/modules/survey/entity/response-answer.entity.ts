import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';
import { QuestionOption } from './question-option.entity';
import { SurveyResponse } from './survey-response.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('response_answers')
export class ResponseAnswer extends BaseEntity {
  @Column({ name: 'response_id' })
  response_id: number;

  @Column({ name: 'question_id' })
  question_id: number;

  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answer_text: string;

  @Column({ name: 'selected_option_id', type: 'int', nullable: true })
  selected_option_id: number | null;

  @Column({ name: 'rating_value', type: 'int', nullable: true })
  rating_value: number | null;

  @ManyToOne(() => SurveyResponse, (response) => response.answers)
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => QuestionOption)
  @JoinColumn({ name: 'selected_option_id' })
  selected_option: QuestionOption;
}
