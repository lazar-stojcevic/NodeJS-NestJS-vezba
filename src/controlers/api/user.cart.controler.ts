import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Cart } from "src/entities/cart.entity";
import { AllowToRoles } from "src/entities/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/entities/misc/role.checker.guard";
import { CartService } from "src/services/cart/cart.service";
import { Request } from "express";
import { addArticleToCartDTO } from "src/dtos/cart/add.article.to.cart.dto";
import { EditArticleInCartDTO } from "src/dtos/cart/edit.article.in.cart.dto";

@Controller('api/user/cart')
export class UserCartControler{
    constructor(private cartService: CartService){}

    private async getActiceCartForUserId(userId: number): Promise<Cart>{
        let cart = await this.cartService.getLastActiveCartByUserId(userId);

        if(!cart){
            cart = await this.cartService.createNewCartForUser(userId);
        }

        return await this.cartService.getById(cart.cartId);// ovo radimo da bi vratili prosirene informacije o cartu onom metodom iz servisa
    }

    @Get('')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async getCurrentCart(@Req() req: Request):Promise<Cart>{
        return await this.getActiceCartForUserId(req.token.id);
        
    }

    @Post('addToCart')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async addToCart(@Body() data: addArticleToCartDTO, @Req() req: Request): Promise<Cart>{
        const cart = await this.getActiceCartForUserId(req.token.id);

        return await this.cartService.addArticleToCart(cart.cartId, data.articleId, data.quantity);
    }

    @Patch('')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async changeQuantity(@Body() data: EditArticleInCartDTO,@Req() req: Request){
        const cart = await this.getActiceCartForUserId(req.token.id);
        return await this.cartService.changeQuantity(cart.cartId, data.articleId, data.quantity);
    }

}