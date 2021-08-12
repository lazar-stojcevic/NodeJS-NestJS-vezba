import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { MailConfing } from "config/mail.config";
import { join } from "path/posix";
import { CartArticle } from "src/entities/cart-article.entity";
import { Order } from "src/entities/order.entity";

@Injectable()
export class OrderMailer {
    constructor(private readonly mailService: MailerService){}
    async sendOrderEmail(order: Order){
        await this.mailService.sendMail({
            to: order.cart.user.email,
            bcc: MailConfing.orderNotificationMail,
            subject: 'Order details',
            encoding: 'UTF-8',
            replyTo: 'no-replay@domain.com',
            html: this.MakeOrderHtml(order)
        })

    }
    private MakeOrderHtml(order: Order): string {
        let suma = order.cart.cartArticles.reduce((sum, current: CartArticle) => {
            return sum + current.quantity * current.article.articlePrices[current.article.articlePrices.length - 1].price;
        }, 0)

        return `<p> Zahvaljujemo se za vasu porudzbinu  </p>
        <p> Ovo su detalji vase porudzbine: </p>
        <ul>
            ${order.cart.cartArticles.map((cartArticle: CartArticle) => {
                return `<li>
                ${cartArticle.article.name} x
                ${cartArticle.quantity}
                </li>`;
            }).join("")}
        </ul>
        <p>Ukupan iznos je: ${suma} EUR. </p>
        `;
    }
}