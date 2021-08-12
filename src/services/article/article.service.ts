import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { ArticleFeature } from "src/entities/article-feature.entity";
import { ArticlePrice } from "src/entities/article-price.entity";
import { Article } from "src/entities/article.entity";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { AddArticleDTO } from "src/dtos/article/add.article.dto";
import { Any, Repository } from "typeorm";
import { EditArticleDTO } from "src/dtos/article/edit.article.dto";
import { ArticleSearchDTO } from "src/dtos/article/article.search.dto";
import { In } from "typeorm";

@Injectable()
export class ArticleService extends TypeOrmCrudService<Article>{
    constructor(
        @InjectRepository(Article) private readonly article: Repository<Article>,
        @InjectRepository(ArticlePrice) private readonly articlePrice: Repository<ArticlePrice>,
        @InjectRepository(ArticleFeature) private readonly articleFeature: Repository<ArticleFeature>
    ){
        super(article);
    }

    async createFullArticle(data: AddArticleDTO): Promise<Article | ApiResponse>{
        let newArticle: Article = new Article();
        newArticle.name = data.name;
        newArticle.categoryId = data.categoryId;
        newArticle.excerpt = data.excerpt;
        newArticle.descrtiption = data.description;

        let savedArticle = await this.article.save(newArticle);
        let newArticlePrice: ArticlePrice = new ArticlePrice();
        newArticlePrice.articleId = savedArticle.articleId;
        newArticlePrice.price = data.price;

        await this.articlePrice.save(newArticlePrice);

        for(let feature of data.features){
            let newArticleFeature = new ArticleFeature();
            newArticleFeature.articleId = savedArticle.articleId;
            newArticleFeature.featureId = feature.featureId;
            newArticleFeature.value = feature.value;

            await this.articleFeature.save(newArticleFeature);
        }

        return await this.article.findOne(savedArticle.articleId, {
            relations: [
                "category",
                "articleFeatures",
                "features",
                "articlePrices",
                "photos"
            ]
        });


    }

    async editFullArticle(articleId: number, data: EditArticleDTO):Promise<Article|ApiResponse>{
        const existingArticle: Article = await this.article.findOne(articleId, {
            relations: ['articlePrices', 'articleFeatures']
        });

        if(!existingArticle){
            return new ApiResponse('error', -5001, 'Article not found');
        }

        existingArticle.name = data.name;
        existingArticle.categoryId = data.categoryId;
        existingArticle.excerpt = data.excerpt;
        existingArticle.descrtiption = data.description;
        existingArticle.status = data.status;
        existingArticle.isPromoted = data.isPromoted;

        const savedArticle = await this.article.save(existingArticle);
        if(!savedArticle){
            return new ApiResponse('error', -5002, 'Cound save new article data');
        }

        const newPrice: string = Number(data.price).toFixed(2);

        const lastPrice = existingArticle.articlePrices[existingArticle.articlePrices.length - 1].price;
        const lastPriceString: string = Number(lastPrice).toFixed(2);

        if(newPrice !== lastPriceString){
            const newArticlePrice = new ArticlePrice();
            newArticlePrice.articleId = articleId;
            newArticlePrice.price = data.price;

            const savedArticlePrice = await this.articlePrice.save(newArticlePrice);
            if(!savedArticlePrice){
                return new ApiResponse('error', -5003, 'Cound save new article price');
            }
        }

        if(data.features !== null){
            await this.articleFeature.remove(existingArticle.articleFeatures); // moze da mu se da niz onog cega zelimo da obrisemo

            for(let feature of data.features){
                let newArticleFeature = new ArticleFeature();
                newArticleFeature.articleId = articleId;
                newArticleFeature.featureId = feature.featureId;
                newArticleFeature.value = feature.value;
    
                await this.articleFeature.save(newArticleFeature);
            }
        }

        return await this.article.findOne(articleId, {
            relations: [
                "category",
                "articleFeatures",
                "features",
                "articlePrices",
                "photos"
            ]
        });

    }

    async search(data: ArticleSearchDTO): Promise<Article[]>{
        const builder = await this.article.createQueryBuilder("article");

        builder.innerJoinAndSelect("article.articlePrices",
         "ap",
         "ap.createdAt = (SELECT MAX(ap.created_it) FROM article_price AS ap WHERE ap.article_id = article.article_id)"); //Ovo treba da se izbegava
        builder.leftJoinAndSelect("article.articleFeatures", "af");

        builder.where('article.categoryId = :catId', {catId: data.categoryId}) //: znaci da je u pitanju parametar

        if(data.keywords && data.keywords.length > 0){
            builder.andWhere("(article.name LIKE :kw OR article.excerpt LIKE :kw OR article.descrtiption LIKE :kw)",
                                {kw:'%' + data.keywords + '%'});
        }

        if(data.priceMin && typeof data.priceMin === 'number'){
            builder.andWhere('ap.price >= :min', {min: data.priceMin});
        }

        if(data.priceMax && typeof data.priceMax === 'number'){
            builder.andWhere('ap.price <= :max', {max: data.priceMax});
        }

        if(data.features && data.features.length > 0){
            for(const feature of data.features){
                builder.andWhere('af.featureId = :fId AND af.value IN (:fVals)', 
                {
                    fId: feature.featureId,
                    fVals: feature.values
                }
                );
            }
        }

        let orderBy = 'article.name';
        let orderDirection: 'ASC' | 'DESC' = 'ASC';

        if(data.orderBy){
            orderBy = data.orderBy;

            if(orderBy === 'price'){
                orderBy = 'ap.price';
            }
            if(orderBy === 'name'){
                orderBy = 'article.name';
            }
        }

        if(data.orderDirection){
            orderDirection = data.orderDirection;
        }

        builder.orderBy(orderBy, orderDirection);

        let page = 0;
        let perPage: 5|10|25|50|75 = 25;
        if(data.page && typeof data.page === 'number'){
            page = data.page;
        }

        if(data.itemsPerPage && typeof data.itemsPerPage === 'number'){
            perPage = data.itemsPerPage;
        }

        builder.skip(page * perPage);
        builder.take(perPage);

        let articleIds = await (await builder.getMany()).map(article => article.articleId);
        
        return await this.article.find({
            where: { articleId: In(articleIds)},
            relations: [
                "category",
                "articleFeatures",
                "features",
                "articlePrices",
                "photos"
            ]
        });
    }
}