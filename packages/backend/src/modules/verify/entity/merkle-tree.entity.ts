import { Entity, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Survey } from 'src/modules/survey/entity/survey.entity';

@Entity('merkle_tree')
export class MerkleTree extends BaseEntity {
  @Column({ type: 'int' })
  survey_id: number;

  @Column({ type: 'mediumtext' })
  merkle_tree: string;

  @ManyToOne(() => Survey, (survey) => survey.id)
  survey: Survey;
}
