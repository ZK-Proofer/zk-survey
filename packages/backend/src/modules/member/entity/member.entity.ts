import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../const/role.const';
@Entity('member')
export class Member extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nickname: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;
}
