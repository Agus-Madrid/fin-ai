import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '../categories/category.entity';
import { User } from '../user/user.entity';
import { decimalTransformer } from '../../common/utils/util';

@Entity('fixed_commitment')
export class FixedCommitment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('decimal', {
    name: 'amount',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @ManyToOne(() => Category, { nullable: true })
  category: Category;

  @ManyToOne(() => User, (user) => user.fixedCommitments)
  user: User;
}
