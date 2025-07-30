import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Member } from '../../member/entity/member.entity';
import { BaseEntity } from 'src/common/entity/base.entity';
import { SurveyStatus } from '../const/survey-status.const';
import { Question } from './question.entity';
import { MerkleTree } from '../../merkletree/entity/merkle-tree.entity';

@Entity('surveys')
export class Survey extends BaseEntity {
  @Column({ name: 'author_id' })
  author_id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SurveyStatus, default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'author_id' })
  author: Member;

  @OneToMany(() => Question, (question) => question.survey)
  questions: Question[];

  @OneToOne(() => MerkleTree, (merkletree) => merkletree.survey)
  merkletree: MerkleTree;
}
