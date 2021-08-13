export class LoginInfoDTO{
    id: number;
    identity: string;
    token: string;
    refreshToken: string;
    refrestTokenExpiresAt: string;

    constructor(id: number, identity: string, jwt: string,refreshToken: string,refrestTokenExpiresAt: string){
        this.id = id;
        this.identity = identity;
        this.token = jwt;
        this.refreshToken = refreshToken;
        this.refrestTokenExpiresAt = refrestTokenExpiresAt;
    }
}