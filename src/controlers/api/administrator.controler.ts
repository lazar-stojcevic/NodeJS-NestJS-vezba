import { Body, Controller, Get, Param, Post, Put, SetMetadata, UseGuards } from "@nestjs/common";
import { Administrator } from "src/entities/administrator.entity";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { AddAdministratorDTO } from "src/dtos/administrator/add.administrator.dto";
import { EditAdministratorDTO } from "src/dtos/administrator/edit.administrator.dto";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { AllowToRoles } from "src/entities/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/entities/misc/role.checker.guard";

@Controller('api/administrator')
export class AdministratorControler{
    constructor(private administratorService: AdministratorService){}

    @Get('')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
        getAll():Promise<Administrator[]>{
        return this.administratorService.getAll();
    }

    @Get(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
        getById( @Param('id') administratorId: number):Promise<Administrator | ApiResponse>{
        return this.administratorService.getById(administratorId);
    }

    @Put()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
    add(@Body() data: AddAdministratorDTO): Promise<Administrator | ApiResponse>{
        return this.administratorService.add(data);
    }

    @Post(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
    edit(@Param('id') id : number, @Body() data: EditAdministratorDTO): Promise<Administrator| ApiResponse>{
        return this.administratorService.editById(id, data);
    }

}