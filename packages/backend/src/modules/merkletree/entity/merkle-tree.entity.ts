import { Entity, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Survey } from 'src/modules/survey/entity/survey.entity';

@Entity('merkle_tree')
export class MerkleTree extends BaseEntity {
  @Column({ type: 'int' })
  survey_id: number;

  @Column({ type: 'int' })
  depth: number;

  @Column({ type: 'mediumtext' })
  leaves: string;

  @ManyToOne(() => Survey, (survey) => survey.id)
  survey: Survey;
}
