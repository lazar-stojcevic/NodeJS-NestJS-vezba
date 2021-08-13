import { Body, Controller, HttpException, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AllowToRoles } from "src/entities/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/entities/misc/role.checker.guard";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { UserService } from "src/services/user/user.service";
import { Request } from "express";
import { UserRefreshTokenDTO } from "src/dtos/auth/user.refresh.token.dto";
import { ApiResponse } from "src/entities/misc/api.response.class";
import * as jwt from 'jsonwebtoken'
import { JwtRefreshDataDTO } from "src/dtos/auth/jwt.refresh.dto";
import { jwtSecret } from "config/jwt.secret";
import { JwtDataDTO } from "src/dtos/auth/jwt.data.dto";
import { LoginInfoDTO } from "src/dtos/auth/login.info.dto";

@Controller('token')
export class TokenControler {
    constructor(
        private administratorService: AdministratorService,
        private userService: UserService)
        {}

        @Post('user/refresh')
        @UseGuards(RoleCheckerGuard)
        @AllowToRoles('user')
        async userTokenRefresh(@Req() req: Request, @Body() data: UserRefreshTokenDTO): Promise<LoginInfoDTO| ApiResponse>{
            const userToken = await this.userService.getUserToken(data.token);

            if(!userToken){
                return new ApiResponse('error', -10002, 'No such refresh token');
            }

            if(userToken.isValid === 0){
                return new ApiResponse('error', -10003, 'Token is no longer valid');
            }

            const sada = new Date();
            const datumIsteka = new Date(userToken.expiresAt.replace(" ", "T") +"Z");

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

}