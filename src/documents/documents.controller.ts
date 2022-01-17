import { Controller, Get, Param, Post, Res, UploadedFile } from '@nestjs/common';
import { Response } from 'express';
import { UploadFile } from 'src/decorators/CustomFileInterceptor';
import { DocumentsService } from './documents.service';
@Controller('files')
export class DocumentsController {
    constructor(private readonly documentsService:DocumentsService){}
    @Get("*")
    getFile(@Param("0") req:string,@Res() response: Response){
        this.documentsService.getFile(req,response)
    }
    @Post("test")
    // @UploadFile({upload:"test.txt",typeFile:'text'})
    testFile(){
        return this.documentsService.test()
    }
}
