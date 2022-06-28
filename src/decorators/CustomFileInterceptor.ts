import { UnsupportedMediaTypeException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as FTPStorage from 'multer-ftp'
import { ftpConfig, FTP_ENABLED } from 'src/helpers/constant';
import * as mine from 'mime-types'
export function UploadFile(options:{fieldName?: string,typeFile?:"all"|"image"|"text",amount?:number}):MethodDecorator{
  const fieldName = options.fieldName||"file"
  const typeFile = options.typeFile||"all"
  const amount = options.amount||1
  if(!FTP_ENABLED)return UseInterceptors()
  const localOptions = {
    storage: new FTPStorage({
      destination: function (req, file, options, callback) {
        console.log(file)
        const valid = typeFile==="all"?null:
        file.mimetype.startsWith(typeFile+"/")?null:new UnsupportedMediaTypeException("Please enter "+typeFile+" here")
        callback(valid, 'tmp/'+Date.now()+"."+mine.extension(file.mimetype));
      },
      ftp: ftpConfig
    })
  }
  if(amount==1)return UseInterceptors(FileInterceptor(fieldName, localOptions))
  if(amount>1)return UseInterceptors(FilesInterceptor(fieldName, amount, localOptions))
}