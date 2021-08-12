import { MailerModule } from '@nestjs-modules/mailer';
import { MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from 'config/database.configuration';
import { MailConfing } from 'config/mail.config';
import { Administrator } from 'src/entities/administrator.entity';
import { ArticleFeature } from 'src/entities/article-feature.entity';
import { ArticlePrice } from 'src/entities/article-price.entity';
import { Article } from 'src/entities/article.entity';
import { CartArticle } from 'src/entities/cart-article.entity';
import { Cart } from 'src/entities/cart.entity';
import { Category } from 'src/entities/category.entity';
import { Feature } from 'src/entities/feature.entity';
import { Order } from 'src/entities/order.entity';
import { Photo } from 'src/entities/photo.entity';
import { User } from 'src/entities/user.entity';
import { AdministratorControler } from './controlers/api/administrator.controler';
import { AdministratorOrderControler } from './controlers/api/administrator.order.controler';
import { ArticleControler } from './controlers/api/article.controler';
import { AuthController } from './controlers/api/auth.controler';
import { CategoryControler } from './controlers/api/category.controler';
import { FeatureControler } from './controlers/api/feature.controler';
import { UserCartControler } from './controlers/api/user.cart.controler';
import { AppController } from './controlers/app.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AdministratorService } from './services/administrator/administrator.service';
import { ArticleService } from './services/article/article.service';
import { CartService } from './services/cart/cart.service';
import { CategoryService } from './services/category/category.service';
import { FeatureService } from './services/feature/feature.service';
import { OrderMailer } from './services/order/order.mailer.service';
import { OrderService } from './services/order/order.service';
import { PhotoService } from './services/photo/photo.service';
import { UserService } from './services/user/user.service';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: databaseConfiguration.hostname,
      port: 3306, //port koji je setovan u bazi
      username: databaseConfiguration.username,
      password: databaseConfiguration.password,
      database: databaseConfiguration.database,
      entities: [
        Administrator,
        ArticleFeature,
        ArticlePrice,
        Article,
        CartArticle,
        Cart,
        Category,
        Feature,
        Order,
        Photo,
        User
      ]
    }),
    TypeOrmModule.forFeature([
      Administrator,
        ArticleFeature,
        ArticlePrice,
        Article,
        CartArticle,
        Cart,
        Category,
        Feature,
        Order,
        Photo,
        User]),
        MailerModule.forRoot({
          transport: 'smtps://' + MailConfing.username + ':' + MailConfing.password + '@' + MailConfing.hostname,
          defaults: {
            from: MailConfing.senderEmail,
          }
        }),
  ],
  controllers: [
     AppController,
     AdministratorControler,
     CategoryControler,
     ArticleControler,
     AuthController,
     FeatureControler,
     UserCartControler,
     AdministratorOrderControler,
     ],
  providers: [
    AdministratorService,
    CategoryService,
    ArticleService,
    PhotoService,
    FeatureService,
    UserService,
    CartService,
    OrderService,
    OrderMailer,
  ],
  exports:[ //Ovo radimo da bi nam ove stvari bile dostupne u middleware
    AdministratorService,
    UserService
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('auth/*')
      .forRoutes('api/*');
  }
}
