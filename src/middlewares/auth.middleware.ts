import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as jwt from 'jsonwebtoken'
import { JwtDataAdministratorDTO } from "src/dtos/administrator/jwt.data.administrator.dto";
import { jwtSecret } from "config/jwt.secret";

@Injectable()
export class AuthMiddleware implements NestMiddleware{
    constructor(private administratorService: AdministratorService){

    }
    async use(req: Request, res: Response, next: NextFunction) {
        if (!req.headers.authorization){
            throw new HttpException('Token not found', HttpStatus.UNAUTHORIZED);
        }

        const token = req.headers.authorization;

        const tokenParts = token.split(' ');
        if (tokenParts.length !== 2){
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        const tokenString = tokenParts[1];


        const jwtData: JwtDataAdministratorDTO = jwt.verify(tokenString, jwtSecret);
        if (!jwtData){
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        const ip = req.ip.toString();

        if(jwtData.ip !== req.ip.toString()){
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        if(jwtData.ua !== req.headers["user-agent"]){
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        const administrator = await this.administratorService.getById(jwtData.administratorId);
        if (!administrator){
            throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
        }

        const trenutniTimespamp = new Date().getTime() / 1000;

        if (trenutniTimespamp >= jwtData.ext){
            throw new HttpException('The token has expired', HttpStatus.UNAUTHORIZED);
        }

        next();
    }
    
}