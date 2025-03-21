import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string; 

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}