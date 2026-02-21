import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('upload')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'filename' })
  filename: string;

  @Column({ name: 'storageKey' })
  storageKey: string; // this is url on s3 or other storage service

  @Column({
    type: 'enum',
    enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PROCESSING',
  })
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.uploads)
  user: User;
}
