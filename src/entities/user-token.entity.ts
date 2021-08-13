import {
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
  } from "typeorm";
  import * as Validator from 'class-validator';

  @Entity("user_token")
  export class UserToken {
    @PrimaryGeneratedColumn({ type: "int", name: "user_token_id", unsigned: true })
    userTokenId: number;

    @Column('int',
    {name: "user_id", unsigned: true})
    userId: number;

    @Column('timestamp',
    {name: "created_at", unsigned: true})
    createdAt: string;

    @Column('text')
    @Validator.IsNotEmpty()
    @Validator.IsString()
    token: string;

    @Column('datetime',
    {name: "expires_at", unsigned: true})
    expiresAt: string;

    @Column('tinyint',
    {name: 'is_valid', default: 1})
    @Validator.IsNotEmpty()
    @Validator.IsIn([0 , 1])
    isValid: number;
    
  }
  