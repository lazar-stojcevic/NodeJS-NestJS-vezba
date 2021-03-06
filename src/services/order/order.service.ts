import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChangeOrderStatusDTO } from "src/dtos/order/change.order.status.dto";
import { Cart } from "src/entities/cart.entity";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { Order } from "src/entities/order.entity";
import { Repository } from "typeorm";

@Injectable()
export class OrderService {
    constructor(
    @InjectRepository(Cart)
    private readonly cart: Repository<Cart>,

    @InjectRepository(Order)
    private readonly order: Repository<Order>
    ) { }

    async add(cartId: number): Promise<Order | ApiResponse>{
        const order = await this.order.findOne({
            cartId: cartId,   //Ne trazimo po idOrder nego po ovome da proverimo da li postoji za trenutnu korpu
        });

        if(order){
            return new ApiResponse('error', -7001, "An order for this cart already exists");
        }
        const cart = await this.cart.findOne(cartId, {
            relations: ["cartArticles"]
        });

        if(!cart){
            return new ApiResponse('error', -7002, "No such cart found");
        }

        if(cart.cartArticles.length === 0){
            return new ApiResponse('error', -7003, "This cart is empty");
        }

        const newOrder: Order = new Order();
        newOrder.cartId = cartId;
        const savedOrder = await this.order.save(newOrder);

        return await this.getById(savedOrder.orderId);

    }

    async getById(orderId: number){
        return await this.order.findOne(orderId, {relations: [
            "cart",
            "cart.cartArticles",
            "cart.cartArticles.article",
            "cart.cartArticles.article.category",
            "cart.cartArticles.article.articlePrices",   
        ]
    });
    }

    async changeStatus(id: number, newStatus:"rejected" | "accepted" | "shipped" | "pending" ): Promise<Order | ApiResponse> {
        const order = await this.getById(id);

        if(!order){
            return new ApiResponse('error', -9001, 'No such order found');
        }

        order.status = newStatus;

        await this.order.save(order);

        return await this.getById(id);
    }

}