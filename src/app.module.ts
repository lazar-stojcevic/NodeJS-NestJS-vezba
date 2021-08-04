import { MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from 'config/database.configuration';
import { Administrator } from 'entities/administrator.entity';
import { ArticleFeature } from 'entities/article-feature.entity';
import { ArticlePrice } from 'entities/article-price.entity';
import { Article } from 'entities/article.entity';
import { CartArticle } from 'entities/cart-article.entity';
import { Cart } from 'entities/cart.entity';
import { Category } from 'entities/category.entity';
import { Feature } from 'entities/feature.entity';
import { Order } from 'entities/order.entity';
import { Photo } from 'entities/photo.entity';
import { User } from 'entities/user.entity';
import { AdministratorControler } from './controlers/api/administrator.controler';
import { ArticleControler } from './controlers/api/article.controler';
import { AuthController } from './controlers/api/auth.controler';
import { CategoryControler } from './controlers/api/category.controler';
import { AppController } from './controlers/app.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AdministratorService } from './services/administrator/administrator.service';
import { ArticleService } from './services/article/article.service';
import { CategoryService } from './services/category/category.service';
import { PhotoService } from './services/photo/photo.service';


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
        User])
  ],
  controllers: [AppController, AdministratorControler, CategoryControler, ArticleControler, AuthController],
  providers: [
    AdministratorService,
    CategoryService,
    ArticleService,
    PhotoService
  ],
  exports:[ //Ovo radimo da bi nam ove stvari bile dostupne u middleware
    AdministratorService
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
