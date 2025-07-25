import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';
import { BaseEntity } from 'src/modules/common/entity/base.entity';

@Entity('question_options')
export class QuestionOption extends BaseEntity {
  @Column({ name: 'question_id' })
  question_id: number;

  @Column({ type: 'varchar', length: 255 })
  text: string;

  @Column({ name: 'order_index', default: 0 })
  order_index: number;

  @ManyToOne(() => Question, (question) => question.options)
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
