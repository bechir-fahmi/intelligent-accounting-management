import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { UserType } from '../user-type.enum';
import { Document } from '../../documents/entities/document.entity';

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
  
  // This is the discriminator column that TypeORM will manage automatically
  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.FINANCE
  })
  @Expose()
  type: UserType;

  @OneToMany(() => Document, document => document.uploadedBy)
  documents: Document[];

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  resetPasswordExpires?: Date;
}