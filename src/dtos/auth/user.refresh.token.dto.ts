import * as Validator from 'class-validator';
export class UserRefreshTokenDTO{
    @Validator.IsNotEmpty()
    @Validator.IsString()
    token: string;
}