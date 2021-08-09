import { Body, Controller, Post, Put, Req } from "@nestjs/common";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { Request, response } from "express";
import { resolve } from "path/posix";
import { LoginAdministratorDTO } from "src/dtos/administrator/login.addministrator.dto";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as crypto from 'crypto';
import { LoginInfoDTO } from "src/dtos/auth/login.info.dto";
import * as jwt from 'jsonwebtoken';
import { JwtDataDTO } from "src/dtos/auth/jwt.data.dto";
import { jwtSecret } from "config/jwt.secret";
import { userRegistrationDTO } from "src/dtos/user/user.registration.dto";
import { UserService } from "src/services/user/user.service";
import { LoginUserDTO } from "src/dtos/user/login.user.dto";

@Controller('auth')
export class AuthController{
    constructor(public adminitratorService: AdministratorService, public userService: UserService){}

    @Post('administrator/login')
    async doAdministratorLogin(@Body() data: LoginAdministratorDTO,@Req() req: Request): Promise<ApiResponse | LoginInfoDTO>{
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

        const jwtData = new JwtDataDTO();
        jwtData.role = "administrator";
        jwtData.id = administrator.administratorId;
        jwtData.identity = administrator.username;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimeStamp = sada.getTime() / 1000; //Ovo je UnixTimeStapm
        jwtData.exp = istekTimeStamp;
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoDTO(administrator.administratorId, administrator.username, token);

        return new Promise(resolve => {
            resolve(responseObject)
        });
    }

    @Post('user/login')
    async doUserLogin(@Body() data: LoginUserDTO,@Req() req: Request): Promise<ApiResponse | LoginInfoDTO>{
        const user = await this.userService.getByEmail(data.email);

        if (!user){
            return new Promise(resolve => {
                resolve(new ApiResponse('error', -3001))
            });
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHastString = passwordHash.digest('hex').toUpperCase();

        if (user.passwordHash !== passwordHastString){
            return new Promise(resolve =>  resolve(new ApiResponse('error', -3002)));
        }

        const jwtData = new JwtDataDTO();
        jwtData.role = "user";
        jwtData.id = user.userId;
        jwtData.identity = user.email;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimeStamp = sada.getTime() / 1000; //Ovo je UnixTimeStapm
        jwtData.exp = istekTimeStamp;
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoDTO(user.userId, user.email, token);

        return new Promise(resolve => {
            resolve(responseObject)
        });
    }

    @Put('user/register')
    async userRegister(@Body() data: userRegistrationDTO){
        return await this.userService.register(data);
    }
}