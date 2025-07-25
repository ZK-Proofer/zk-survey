import { BaseEntity } from 'src/modules/common/entity/base.entity';
import { Column, Entity } from 'typeorm';
import { MemberRole } from '../const/member-role.const';

@Entity('members')
export class Member extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  nickname: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.USER })
  role: MemberRole;
}
