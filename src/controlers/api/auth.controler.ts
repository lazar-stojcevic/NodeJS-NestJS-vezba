import { Body, Controller, HttpException, HttpStatus, Post, Put, Req } from "@nestjs/common";
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
import { JwtRefreshDataDTO } from "src/dtos/auth/jwt.refresh.dto";
import { UserRefreshTokenDTO } from "src/dtos/auth/user.refresh.token.dto";

@Controller('auth')
export class AuthController{
    constructor(
            public adminitratorService: AdministratorService,
            public userService: UserService){}

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

        jwtData.exp = this.getDatePlus(60 * 60 * 24 * 31);
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoDTO(
            administrator.administratorId,
             administrator.username,
              token,
              "",
              "");

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
        jwtData.exp = this.getDatePlus(60 * 5);
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const jwtRefreshData = new JwtRefreshDataDTO();
        jwtRefreshData.role = jwtData.role;
        jwtRefreshData.id = jwtData.id;
        jwtRefreshData.identity = jwtData.identity;
        jwtRefreshData.exp = this.getDatePlus(60 * 60 * 24 * 31);
        jwtRefreshData.ip = jwtData.ip;
        jwtRefreshData.ua = jwtData.ua;

        let refreshToken: string = jwt.sign(jwtRefreshData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoDTO(
            user.userId,
            user.email,
            token,
            refreshToken,
            this.getIsoDate(jwtRefreshData.exp),
            );

        await this.userService.addToken(user.userId,
                                        refreshToken,
                                        this.getDataBaseDateFormat(this.getIsoDate(jwtRefreshData.exp))
        );    

        return new Promise(resolve => {
            resolve(responseObject)
        });
    }

    @Post('user/register')
    async userRegister(@Body() data: userRegistrationDTO){
        return await this.userService.register(data);
    }
    
    @Post('user/refresh')
        async userTokenRefresh(@Req() req: Request, @Body() data: UserRefreshTokenDTO): Promise<LoginInfoDTO| ApiResponse>{
            const userToken = await this.userService.getUserToken(data.token);

            if(!userToken){
                return new ApiResponse('error', -10002, 'No such refresh token');
            }

            if(userToken.isValid === 0){
                return new ApiResponse('error', -10003, 'Token is no longer valid');
            }

            const sada = new Date();
            const datumIsteka = new Date(userToken.expiresAt);

            if(datumIsteka.getTime() < sada.getTime() ){
                return new ApiResponse('error', -10004, 'Token ha expired');
            }

            let jwtRefreshData: JwtRefreshDataDTO;

            try{
                jwtRefreshData = jwt.verify(data.token, jwtSecret);
            }catch(e){
                throw new HttpException('Bad Token found', HttpStatus.UNAUTHORIZED);
            }

            if(!jwtRefreshData){
                throw new HttpException('Bad Token found', HttpStatus.UNAUTHORIZED);
            }

            if(jwtRefreshData.ip !== req.ip.toString()){
                throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
            }
    
            if(jwtRefreshData.ua !== req.headers["user-agent"]){
                throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
            }

            const jwtData = new JwtDataDTO();
            jwtData.role = jwtRefreshData.role;
            jwtData.id = jwtRefreshData.id;
            jwtData.identity = jwtRefreshData.identity;
            jwtData.exp = this.getDatePlus(60 * 5);
            jwtData.ip = jwtRefreshData.ip;
            jwtData.ua = jwtRefreshData.ua;

            let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

            const responseObject = new LoginInfoDTO(
                jwtData.id,
                jwtData.identity,
                token,
                data.token,
                this.getIsoDate(jwtRefreshData.exp), //Ovo radimo jer datum u bazi i Date() nema isti format
                );
            
            return responseObject;

        }


    private getDatePlus(numberOfSeconds: number): number{
        return new Date().getTime() / 1000 + numberOfSeconds;
    }

    private getIsoDate(timestamp: number): string{
        const date = new Date();
        date.setTime(timestamp * 1000);
        return date.toISOString();
    }

    private getDataBaseDateFormat(isoFormat: string): string{
        return isoFormat.substr(0, 19).replace('T', ' ');
    }
}