import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('auth')
export class Auth extends BaseEntity {
  @Column()
  email: string;

  @Column({
    unique: true,
    default: () => 'uuid_generate_v4()',
  })
  uuid: string;

  @Column()
  commitment: string;
}
