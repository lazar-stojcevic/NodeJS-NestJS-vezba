import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Administrator } from 'entities/administrator.entity';
import { ApiResponse } from 'entities/misc/api.response.class';
import { response } from 'express';
import { resolve } from 'path/posix';
import { AddAdministratorDTO } from 'src/dtos/administrator/add.administrator.dto';
import { EditAdministratorDTO } from 'src/dtos/administrator/edit.administrator.dto';
import { Repository } from 'typeorm'; 
import * as crypto from 'crypto';

@Injectable()
export class AdministratorService {
    constructor(@InjectRepository(Administrator)
    private readonly administrator: Repository<Administrator>)
    { }

    getAll(): Promise<Administrator[]> {
        return this.administrator.find();
    }

    async getByUsername(usernameString: string): Promise<Administrator | null>{
        const admin = await this.administrator.findOne({
            username: usernameString
        });
        if (admin){
            return admin;
        }

        return null;
    }

    getById(id : number): Promise<Administrator | ApiResponse>{
        return new Promise(async (resolve) =>{
        let admin = await this.administrator.findOne(id);
        if (admin === undefined){
            resolve(new ApiResponse('error', -1002));
        }
        resolve(admin);
        });
        
    }

    add(data: AddAdministratorDTO): Promise<Administrator | ApiResponse>{
        //DTO -> model
        //username -> username
        //password -[magija]-> password_Hash
        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHastString = passwordHash.digest('hex').toUpperCase();

        let newAdmin: Administrator = new Administrator();
        newAdmin.username = data.username;
        newAdmin.passwordHash = passwordHastString;


        return new Promise((resolve) => {
            this.administrator.save(newAdmin)
            .then(data => resolve(data))
            .catch(error => {
                const response: ApiResponse = new ApiResponse("error", -1001);
                resolve(response);
            })
        });
    }

    async editById(id: number, data: EditAdministratorDTO):Promise<Administrator| ApiResponse>{
        let admin: Administrator = await this.administrator.findOne(id);

        if (admin === undefined){
            return new Promise((resolve) => {
                resolve(new ApiResponse('error', -1002));
            });
        }
        
        const crypto = require('crypto');
        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHastString = passwordHash.digest('hex').toUpperCase();
        
        admin.passwordHash = passwordHastString;
        return this.administrator.save(admin);

        //moze i this.administrator.update
    }
}
