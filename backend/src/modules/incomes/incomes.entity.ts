import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user/user.entity";

@Entity('income')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column('decimal', {
    name: 'amount',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({ name: 'description', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.incomes)
  user: User;
}