import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { ArticleFeature } from "entities/article-feature.entity";
import { Article } from "entities/article.entity";
import { AddArticleDTO } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import {diskStorage} from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "entities/photo.entity";
import { ApiResponse } from "entities/misc/api.response.class";

@Controller('api/article')
@Crud({
    model:{
        type: Article
    },
    params:{
        id: {
            field: 'articleId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join:{
            category:{
                eager: true
            },
            photos:{
                eager: true
            },
            articlePrices:{
                eager: true
            },
            articleFeatures:{
                eager: true
            },
            features:{
                eager: true
            }
        }
    }
})
export class ArticleControler{
    constructor(
        public service: ArticleService,
        public photoService: PhotoService
        ){}

    @Post('createFull')
    createFullArticle(@Body() data: AddArticleDTO){
        return this.service.createFullArticle(data);
    }

    @Post(':id/uploadPhoto/')
    @UseInterceptors(FileInterceptor('photo', {
        storage: diskStorage({
            destination: StorageConfig.photoDestination,
            filename: (req, file, callback) => {
                let original: string = file.originalname;

                let normalized = original.replace(/\s+/g, '-');

                normalized = normalized.replace(/[^A-z0-9\.\-]/g, '');
                let sada = new Date();
                let datePart = '';
                datePart += sada.getFullYear().toString();
                datePart += (sada.getMonth() + 1).toString();
                datePart += sada.getDate().toString();

                let randomPart : string = new Array(10)
                    .fill(0)
                    .map(e => (Math.random() * 10).toFixed(0).toString())
                    .join('').toString();

                let fileName = datePart + '-' + randomPart + '-' + normalized;

                fileName = fileName.toLowerCase();
                
                callback(null, fileName);
            }
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.toLowerCase().match(/\.(jpg|png)$/)){
                callback(new Error('Bad file extensions'), false);
                return;
            }

            if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))){
                callback(new Error('Bad file content'), false);
                return; 
            }

            callback(null, true);
        },
        limits: {
            files: 1,
            fieldSize: StorageConfig.photoMaxFileSize
        }
    })
    )
    async uploadPhoto(@Param('id') articleId: number, @UploadedFile() photo):Promise <ApiResponse|Photo>{
        let filename = photo.filename;

        const newPhoto: Photo = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;
        
        const savedPhoto = await this.photoService.add(newPhoto);

        if(!savedPhoto){
            return new ApiResponse('error', -4001);
        }

        return savedPhoto;
    }
}