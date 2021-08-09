import { Body, Controller, Post, Put, Req } from "@nestjs/common";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { Request, response } from "express";
import { resolve } from "path/posix";
import { LoginAdministratorDTO } from "src/dtos/administrator/login.addministrator.dto";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as crypto from 'crypto';
import { LoginInfoAdminitratorDTO } from "src/dtos/administrator/login.info.administrator.dto";
import * as jwt from 'jsonwebtoken';
import { JwtDataAdministratorDTO } from "src/dtos/administrator/jwt.data.administrator.dto";
import { jwtSecret } from "config/jwt.secret";
import { userRegistrationDTO } from "src/dtos/user/user.registration.dto";
import { UserService } from "src/services/user/user.service";

@Controller('auth')
export class AuthController{
    constructor(public adminitratorService: AdministratorService, public userService: UserService){}

    @Post('login')
    async doLogin(@Body() data: LoginAdministratorDTO,@Req() req: Request): Promise<ApiResponse | LoginInfoAdminitratorDTO>{
        const administrator = await this.adminitratorService.getByUsername(data.username);

        if (!administrator){
            return new Promise(resolve => {
                resolve(new ApiResponse('error', -3001))
            });
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHastString = passwordHash.digest('hex').toUpperCase();

        if (administrator.passwordHash !== passwordHastString){
            return new Promise(resolve =>  resolve(new ApiResponse('error', -3002)));
        }

        const jwtData = new JwtDataAdministratorDTO();
        jwtData.administratorId = administrator.administratorId;
        jwtData.username = administrator.username;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimeStamp = sada.getTime() / 1000; //Ovo je UnixTimeStapm
        jwtData.exp = istekTimeStamp;
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoAdminitratorDTO(administrator.administratorId, administrator.username, token);

        return new Promise(resolve => {
            resolve(responseObject)
        });
    }

    @Put('user/register')
    async userRegister(@Body() data: userRegistrationDTO){
        return await this.userService.register(data);
    }
}