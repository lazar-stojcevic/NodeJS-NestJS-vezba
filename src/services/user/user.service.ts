import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { userRegistrationDTO } from "src/dtos/user/user.registration.dto";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { User } from "src/entities/user.entity";
import { Repository } from "typeorm";
import * as crypto from 'crypto';
import { resolve } from "path/posix";

@Injectable()
export class UserService extends TypeOrmCrudService<User>{
    constructor(@InjectRepository(User) private readonly user: Repository<User>){
        super(user);
    }

    async register(data: userRegistrationDTO): Promise<User | ApiResponse>{
        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHastString = passwordHash.digest('hex').toUpperCase();

        const newUser: User = new User();
        newUser.email = data.email;
        newUser.passwordHash = passwordHastString;
        newUser.forename = data.forename;
        newUser.surename = data.surname;
        newUser.phoneNumber = data.phoneNumber;
        newUser.postalAddress = data.postalAdress;

        try{
            const savedUser = await this.user.save(newUser);
            if(!savedUser){
                throw new Error('');
            }

            return savedUser;
            
        }catch(e){
            return new ApiResponse('error', -6001, 'This user account cannot be created');
        }
    }

    async getById(id){
        return await this.user.findOne(id);
    }

    async getByEmail(email: string): Promise<User | null>{
        const user = await this.user.findOne({
            email: email
        });
        if (user){
            return user;
        }

        return null;
    }
}
