import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({name:'name'})
    name:string;

    @Column({name:'password'})
    password:string;

    @Column({unique:true, name: 'email'})
    email:string;

    @Column('date', {name:'created_at'})
    createdAt:string
}