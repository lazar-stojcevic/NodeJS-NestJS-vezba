import * as Validator from 'class-validator';
export class LoginUserDTO {
    @Validator.IsNotEmpty()
    @Validator.IsEmail({
        allow_ip_domain: false,
        allow_utf8_local_part: true,
        require_tld: true, //trazime top level domene tipa da ne moze zola@localhost nego mora da ima .com na kraju na primer
    })
    email: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(6, 128)
    password: string;
}