import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';
import { Member } from 'src/modules/member/entity/member.entity';

@Entity('survey')
export class Survey extends BaseEntity {
  @Column()
  author: Member;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: string;
}
