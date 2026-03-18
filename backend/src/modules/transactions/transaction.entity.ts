import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { TransactionStatus } from './transaction.enum';
import { Category } from '../categories/category.entity';
import { decimalTransformer } from '../../common/utils/util';

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', {
    name: 'amount',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({ name: 'description' })
  description!: string;

  @Column('date', { name: 'date' })
  date!: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    name: 'status',
    default: TransactionStatus.CONFIRMED,
  })
  status: TransactionStatus;

  @Column('varchar', { name: 'source_upload_id', nullable: true, length: 36 })
  sourceUploadId: string | null;

  @Column('varchar', {
    name: 'ingestion_key',
    nullable: true,
    unique: true,
    length: 64,
  })
  ingestionKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  category: Category | null;
}
