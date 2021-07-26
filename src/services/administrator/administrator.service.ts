import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Administrator } from 'entities/administrator.entity';
import { AddAdministratorDTO } from 'src/dtos/administrator/add.administrator.dto';
import { EditAdministratorDTO } from 'src/dtos/administrator/edit.administrator.dto';
import { Repository } from 'typeorm'; 

@Injectable()
export class AdministratorService {
    constructor(@InjectRepository(Administrator)
    private readonly administrator: Repository<Administrator>)
    { }

    getAll(): Promise<Administrator[]> {
        return this.administrator.find();
    }

    getById(id : number): Promise<Administrator>{
        return this.administrator.findOne(id);
    }

    add(data: AddAdministratorDTO): Promise<Administrator>{
        //DTO -> model
        //username -> username
        //password -[magija]-> password_Hash
        const crypto = require('crypto');

        const passwordHash = crypto.createHast('sha512');
        passwordHash.update(data.password);

        const passwordHastString = passwordHash.digest('hex').toUpperCase();

        let newAdmin: Administrator = new Administrator();
        newAdmin.username = data.username;
        newAdmin.passwordHash = passwordHastString;
        return this.administrator.save(newAdmin);
    }

    async editById(id: number, data: EditAdministratorDTO):Promise<Administrator>{
        let admin: Administrator = await this.administrator.findOne(id);
        
        const crypto = require('crypto');
        const passwordHash = crypto.createHast('sha512');
        passwordHash.update(data.password);
        const passwordHastString = passwordHash.digest('hex').toUpperCase();
        
        admin.passwordHash = passwordHastString;
        return this.administrator.save(admin);

        //moze i this.administrator.update
    }
}
