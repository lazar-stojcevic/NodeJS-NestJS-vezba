import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { Administrator } from "src/entities/administrator.entity";
import { ApiResponse } from "src/entities/misc/api.response.class";
import { AddAdministratorDTO } from "src/dtos/administrator/add.administrator.dto";
import { EditAdministratorDTO } from "src/dtos/administrator/edit.administrator.dto";
import { AdministratorService } from "src/services/administrator/administrator.service";

@Controller('api/administrator')
export class AdministratorControler{
    constructor(private administratorService: AdministratorService){}

    @Get('')
        getAll():Promise<Administrator[]>{
        return this.administratorService.getAll();
    }

    @Get(':id')
        getById( @Param('id') administratorId: number):Promise<Administrator | ApiResponse>{
        return this.administratorService.getById(administratorId);
    }

    @Put()
    add(@Body() data: AddAdministratorDTO): Promise<Administrator | ApiResponse>{
        return this.administratorService.add(data);
    }

    @Post(':id')
    edit(@Param('id') id : number, @Body() data: EditAdministratorDTO): Promise<Administrator| ApiResponse>{
        return this.administratorService.editById(id, data);
    }

}