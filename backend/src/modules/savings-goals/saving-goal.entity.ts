import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { decimalTransformer } from '../../common/utils/util';

@Entity('saving_goal')
export class SavingGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('decimal', {
    name: 'target_amount',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  targetAmount: number;

  //@Column({name:'current_amount'})

  @Column('date', { name: 'deadline' })
  deadline: Date;

  @Column('int', { name: 'priority', default: 1 })
  priority: number;

  @ManyToOne(() => User, (user) => user.savingGoals)
  user: User;
}
