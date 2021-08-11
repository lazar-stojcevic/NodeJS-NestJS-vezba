import * as Validator from 'class-validator';
export class EditAdministratorDTO{
    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(6, 128)
    password: string;
}