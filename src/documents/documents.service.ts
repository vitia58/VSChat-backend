import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as fs from "fs"
import * as mime from "mime-types"
import http, { get } from "https"
import { generateAvatar } from "ui-avatars"
import { InjectModel } from '@nestjs/mongoose';
import { File, FileDocument } from 'src/models/File';
import { Model } from 'mongoose';
import { FILES_URL, FTP_ENABLED } from 'src/helpers/constant';
import * as path from 'path'
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import * as Client from 'ftp'
import fetch from 'node-fetch';

@Injectable()
export class DocumentsService {
    constructor(@InjectModel(File.name) private readonly fileModel: Model<FileDocument>) { }
    private readonly logger = new Logger(DocumentsService.name);
    generateImage(text: string, path: string,color1:string='random',replace:boolean=false) {
        // this.createFolder(path)
        
        let color = 
        color1=="random"
          ?this.generateRandomColor()
          :color1
        this.checkExsits(path).then(exsits=>{
            if(exsits){
                const link = generateAvatar({
                    name: text,
                    length: 2,
                    size: 256,
                    background: color,
                    color: this.getColor(color),
                    rounded: true
                })
                if(FTP_ENABLED)this.getFTP((ftp:Client) => {
                    ftp.mkdir(this.getParent(path), true, () => {
                        ftp.list(this.getParent(path), (e, l) => {
                            const ee = path.split("/").pop()
                            if (replace || !(e || l.find(e => e.name == ee))) {
                                get(link, async (response) => {
                                    // this.logger.log(link)
                                    // const buffer = await this.stream2buffer(response)
                                    ftp.put(response, path, async e => {
                                        e && console.log(e)
                                    })
                                    // const j = await Jimp.read(buffer)
                                    // console.log((j.getPixelColor(128, 5)).toString(16).substring(0, 6))
                                })
                            }
                        })
                    });
                })
            }
        })
        return [encodeURI(path),color]
    }

    generateRandomColor(){
        const randHex = ()=>Math.floor(Math.random() * 0x33+(Math.random()<0.5?0x44:0xBB)).toString(16);
        return randHex()+randHex()+randHex()
    }

    getColor(color:string){
        const red = parseInt(color.substr(0,2),16)
        const green = parseInt(color.substr(2,2),16)
        const blue = parseInt(color.substr(4,2),16)
        return red*0.299+green*0.587+blue*0.114>127?"000":"fff"
    }

    createFolder(file: string) {
        const dir = this.getParent(file)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true
            });
        }
    }
    private getParent(file: string) {
        return path.dirname(file)
    }
    generateUserProfilePhoto(userName: string, userLogin: string,color:string='random') {
        const path = `public_html/users/${userLogin}/logos/default.png`
        return this.generateImage(userName, path,color,true)
    }
    pathToUrl(path: string) {
        return path.replace("public_html/", `${FILES_URL}/`)
    }
    async checkExsits(file:string){
        const res = await fetch(encodeURI(this.pathToUrl(file)))
        return res.status!=404
    }
    async test() {

    }
    async uploadImage(file: Express.Multer.File,path:string){
        const ftp = await new Promise(this.getFTP)
        ftp.rename(file.path,path,this.logger.error)
        return path
    }
    async getFTP(callback:(ftp:Client)=>void){
        const ftp = new Client();
        ftp.connect({
            'host': 'files.000webhost.com',
            'user': 'vschat-online',
            'password': 'VitiaSlavaChat',
        })
        ftp.on("ready",()=>callback(ftp))
    }
    async checkAccess(fileName: string, user: CUserDTO) {
        const file = await this.fileModel.findOne({ fileName }).exec()
        return file.users.find((u) => user._id + "" == u + "")
    }
    // async stream2buffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    //     return new Promise<Buffer>((resolve, reject) => {

    //         const _buf = Array<any>();

    //         stream.on("data", chunk => _buf.push(chunk));
    //         stream.on("end", () => resolve(Buffer.concat(_buf)));
    //         stream.on("error", err => reject(`error converting stream - ${err}`));

    //     });
    // } 
    async getFile(req: string, response: Response) {
        let path = "upload/" + req
        // console.log(req)
        const fname = path.split("/").pop()
        if (!fname.includes(".")) {
            fs.readdirSync(this.getParent(path)).forEach(f => {
                if (f.startsWith(fname + ".")) {
                    path = path.replace(fname, f)
                    return;
                }
            })
        }
        //this.logger.log(path)
        //if(await this.checkAccess(path,)){
        const data = fs.createReadStream(path).on("error", () => {
            response.sendStatus(404)
            response.end()
        }).on("open", () => {
            response.setHeader(
                'Content-Type',
                mime.lookup(path) || "",
            );
        }).pipe(response);
        //}
    }
}
