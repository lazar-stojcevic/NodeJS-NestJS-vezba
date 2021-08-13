import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { userRegistrationDTO } from "src/dtos/user/user.registration.dto";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { User } from "src/entities/user.entity";
import { Repository } from "typeorm";
import * as crypto from 'crypto';
import { resolve } from "path/posix";
import { UserToken } from "src/entities/user-token.entity";
import { R } from "@nestjsx/crud/lib/crud";

@Injectable()
export class UserService extends TypeOrmCrudService<User>{
    constructor(@InjectRepository(User) private readonly user: Repository<User>,
                @InjectRepository(UserToken) private readonly userToken: Repository<UserToken>){
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

    async addToken(userId: number, token: string, expiresAt: string){
        const userToken = new UserToken();
        userToken.userId = userId;
        userToken.token = token;
        userToken.expiresAt = expiresAt;

        return await this.userToken.save(userToken);
    }

    async getUserToken(token: string): Promise<UserToken>{
        return await this.userToken.findOne({
            token: token,
        });
    }

    async invalidateToken(token: string): Promise<UserToken | ApiResponse>{
        const userToken = await this.userToken.findOne({
            token: token,
        });

        if(!userToken){
            return new ApiResponse('error', -10001, "No such refresh token");
        }

        userToken.isValid = 0;
        await this.userToken.save(userToken);
        
        return await this.getUserToken(token);
    } 

    async invalidateUserTokens(userId: number): Promise<(UserToken | ApiResponse)[]>{
        const userTokens = await this.userToken.find({
            userId: userId
        });

        const results = [];

        for(const userToken of userTokens){
            results.push(this.invalidateToken(userToken.token));
        }

        return results;
    }
}
