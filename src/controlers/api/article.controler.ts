import { All, Body, Controller, Delete, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { ArticleFeature } from "src/entities/article-feature.entity";
import { Article } from "src/entities/article.entity";
import { AddArticleDTO } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import {diskStorage} from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "src/entities/photo.entity";
import { ApiResponse } from "src/entities/misc/api.response.class";
import * as fileType from 'file-type';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { EditArticleDTO } from "src/dtos/article/edit.article.dto";
import { AllowToRoles } from "src/entities/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/entities/misc/role.checker.guard";
import { ArticleSearchDTO } from "src/dtos/article/article.search.dto";

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
    },
    routes:{
        only:[
            'getOneBase', 
            'getManyBase'
        ],
        getOneBase:{
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        },
        getManyBase:{
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        },
    }
})
export class ArticleControler{
    constructor(
        public service: ArticleService,
        public photoService: PhotoService
        ){}

    @Post('')    
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')    
    createFullArticle(@Body() data: AddArticleDTO){
        return this.service.createFullArticle(data);
    }

    @Patch(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')  
    editFullArticle(@Param('id') id: number, @Body() data:EditArticleDTO){
        return this.service.editFullArticle(id, data);
    }

    @Post(':id/uploadPhoto/')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')  
    @UseInterceptors(FileInterceptor('photo', {
        storage: diskStorage({
            destination: StorageConfig.photo.destination,
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
                req.fileFilterError = 'Bad file extension';
                callback(null, false);
                return;
            }

            if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))){
                req.fileFilterError = 'Bad file content';
                callback(null, false);
                return; 
            }

            callback(null, true);
        },
        limits: {
            files: 1,
            fileSize: StorageConfig.photo.maxSize
        }
    })
    )
    async uploadPhoto(
          @Param('id') articleId: number,
          @UploadedFile() photo,
          @Req() req
          ):Promise <ApiResponse|Photo>{

        if (req.fileFilterError){
            return new ApiResponse('error', -4002, req.fileFilterError);
        }
        
        if (!photo){
            return new ApiResponse('error', -4002, 'File not uploaded!');
        }

        //Real mime type check
        const fileTypeResult = await fileType.fromFile(photo.path);
        if (!fileTypeResult){
            fs.unlinkSync(photo.path);
            return new ApiResponse('error', -4002, 'Cannot detect file type!');
        }

        const realMimeType = fileTypeResult.mime;
        if (!(realMimeType.includes('jpeg') || realMimeType.includes('png'))){
            fs.unlinkSync(photo.path);
            return new ApiResponse('error', -4002, 'Bad file content type!');
        }

        await this.createResizedImage(photo, StorageConfig.photo.resize.thumb);
        await this.createResizedImage(photo, StorageConfig.photo.resize.small);

        const newPhoto: Photo = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;

        
        const savedPhoto = await this.photoService.add(newPhoto);
        if(!savedPhoto){
            return new ApiResponse('error', -4001);
        }

        return savedPhoto;
    }

    async createResizedImage(photo, resizedSetings){
        const originalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = StorageConfig.photo.destination +
        resizedSetings.directory +
         fileName;
        sharp(originalFilePath).resize({
            fit: 'cover',
            width: resizedSetings.width,
            height: resizedSetings.height
        }).toFile(destinationFilePath);
    }

    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')  
    @Delete(':articleId/deletePhoto/:photoId')
    public async deletePhoto(
        @Param('articleId') articleId: number,
        @Param('photoId') photoId: number
    ){
        const photo = await this.photoService.findOne({
            articleId: articleId,
            photoId: photoId
        })

        if(!photo){
            return new ApiResponse('error', -4004, 'Photo not found');
        }
        try{
        fs.unlinkSync(StorageConfig.photo.destination + photo.imagePath);
        fs.unlinkSync(StorageConfig.photo.destination + StorageConfig.photo.destination + photo.imagePath);
        fs.unlinkSync(StorageConfig.photo.destination + StorageConfig.photo.destination + photo.imagePath);
        }catch(e){

        }

        const deleteResult = await this.photoService.deleteById(photoId);

        if(deleteResult.affected === 0){
            return new ApiResponse('error', -4004, 'Photo not found');
        }

        return new ApiResponse('ok', 0, 'One photo deleted');
    }


    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator', 'user')
    @Post('search')
    async search(@Body() data: ArticleSearchDTO): Promise<Article[]>{
        return await this.service.search(data);
    }
}