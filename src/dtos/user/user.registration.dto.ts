import * as Validator from 'class-validator';
export class userRegistrationDTO {
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

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(2, 64)
    forename: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(2, 64)
    surname: string;

    @Validator.IsNotEmpty()
    @Validator.IsPhoneNumber(null)  // da bi mogli da kuramo +381.. ili bilo sta drugo da ne bi to bilo fiksno
    phoneNumber: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(10, 512)
    postalAdress: string;
}