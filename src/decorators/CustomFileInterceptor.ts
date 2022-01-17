import { UnsupportedMediaTypeException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import * as FTPStorage from 'multer-ftp'
import { FTP_ENABLED } from 'src/helpers/constant';
export function UploadFile(options:{fieldName?: string,upload?:string,typeFile?:"all"|"image"|"text"}):MethodDecorator{
  const fieldName = options.fieldName||"file"
  const typeFile = options.typeFile||"all"
  const upload = options.upload||
  typeFile=="all"?"other":
    typeFile=="image"?"images":"texts"
  
  if(!FTP_ENABLED)return UseInterceptors()
  else return UseInterceptors(FileInterceptor(fieldName, {
    storage: new FTPStorage({
      basepath: '/tmp/'+upload,
      destination: function (req, file, options, callback) {
        const valid = typeFile==="all"?null:
        file.mimetype.startsWith(typeFile+"/")?null:new UnsupportedMediaTypeException("Please enter "+typeFile+" here")
        callback(valid, '/tmp/'+Date.now()+extname(file.originalname));
      },
      ftp: {
        host: 'files.000webhost.com',
        user: 'vschat-online',
        password: 'VitiaSlavaChat'
      }
    })
    // diskStorage({
    //   destination: './tmp/'+upload,
    //   filename: (req, file, cb) => {
    //     const valid = typeFile==="all"?null:
    //       file.mimetype.startsWith(typeFile+"/")?null:new UnsupportedMediaTypeException("Please enter "+typeFile+" here")
    //     cb(valid, Date.now()+extname(file.originalname));
    //   },
    // }),
    // dest: './tmp/'+upload,
  }))
}