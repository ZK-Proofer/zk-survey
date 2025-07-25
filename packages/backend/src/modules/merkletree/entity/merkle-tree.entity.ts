import { Entity, Column, ManyToOne } from 'typeorm';
import { Survey } from 'src/modules/survey/entity/survey.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('merkle_tree')
export class MerkleTree extends BaseEntity {
  @Column({ type: 'int' })
  survey_id: number;

  @Column({ type: 'int' })
  depth: number;

  @Column({ type: 'mediumtext' })
  leaves: string;

  @ManyToOne(() => Survey)
  survey: Survey;
}
