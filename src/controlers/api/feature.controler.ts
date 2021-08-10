import { Controller, UseGuards } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { Feature } from "src/entities/feature.entity";
import { AllowToRoles } from "src/entities/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/entities/misc/role.checker.guard";
import { FeatureService } from "src/services/feature/feature.service";

@Controller('api/feature')
@Crud({
    model:{
        type: Feature
    },
    params:{
        id: {
            field: 'featureId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join:{
            articleFeatures:{ //Da se ispisu sve podkategorije
                eager: false
            },
            category:{
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
export class FeatureControler{
    constructor(public service: FeatureService){

    }
}