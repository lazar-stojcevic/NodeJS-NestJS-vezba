import { Controller, UseGuards } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { Category } from "src/entities/category.entity";
import { AllowToRoles } from "src/entities/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/entities/misc/role.checker.guard";

import { CategoryService } from "src/services/category/category.service";

@Controller('api/category')
@Crud({
    model:{
        type: Category
    },
    params:{
        id: {
            field: 'categoryId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join:{
            categories:{ //Da se ispisu sve podkategorije
                eager: true
            },
            parentCategory:{
                eager: false
            },
            features:{
                eager: true
            },
            articles:{
                eager: false
            }
        }
    },
    routes: {
        only: [ //sta je sve dostupno
            "createOneBase",
            "createManyBase",
            "updateOneBase",
            "getManyBase",
            "getOneBase",
        ],
        createOneBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator')
            ]
        },
        createManyBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator')
            ]
        },
        updateOneBase:{
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator')
            ]
        },
        getManyBase:{
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]  
        },
        getOneBase:{
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ] 
        },
        
    }
})
export class CategoryControler{
    constructor(public service: CategoryService){

    }
}