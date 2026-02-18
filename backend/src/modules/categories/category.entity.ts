import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Transaction } from '../transactions/transaction.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'icon', default: '💵' })
  icon: string;

  @ManyToOne(() => User, (user) => user.categories)
  user: User;

  @Column({ name: 'color', default: '#000000' })
  color: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
