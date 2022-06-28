import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as fs from "fs"
import * as mime from "mime-types"
import http, { get } from "https"
import { generateAvatar } from "ui-avatars"
import { InjectModel } from '@nestjs/mongoose';
import { File, FileDocument } from 'src/models/File';
import { Model } from 'mongoose';
import { FILES_URL, ftpConfig, FTP_ENABLED } from 'src/helpers/constant';
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
                this.uploadImageFromUrl(path,link,replace)
            }
        })
        return [encodeURI(path),color]
    }

    generateRandomColor(){
        const randHex = ()=>Math.floor(Math.random() * 0x33+(Math.random()<0.5?0x44:0xBB)).toString(16);
        return randHex()+randHex()+randHex()
    }

    getColor(c:string){
        const color = 
            c.length>=6
                ?c.substr(0,6)
            :c.length>=3
                ?c.substr(0,3)
            :"000"
        const getHex = (n:number)=>{
            const b = color.length==6?2:1
            const c = parseInt(color.substr(n*b,(n+1)*b),16)
            return c*(b==2?1:17)
        }
        const red = getHex(0)
        const green = getHex(1)
        const blue = getHex(2)
        return red*0.299+green*0.587+blue*0.114>127?"000":"fff"
    }

    async createFolder(path: string,ftp:Client) {
        console.log("folder create")
        await new Promise(e=>ftp.mkdir(this.getParent(path), true, e))
    }
    private getParent(file: string) {
        return path.dirname(file)
    }
    generateUserProfilePhoto(userName: string, userLogin: string,color:string='random') {
        const path = `users/${userLogin}/logos/default.png`
        return this.generateImage(userName, path,color,true)
    }
    pathToUrl(path: string) {
        return `${FILES_URL}/${path}`
    }
    async checkExsits(file:string){
        const res = await fetch(encodeURI(this.pathToUrl(file)))
        return res.status!=404
    }
    uploadImageFromUrl(path: string,link:string,replace:boolean=false){
        if(FTP_ENABLED)this.getFTP(async (ftp:Client) => {
            await this.createFolder(path,ftp)
            ftp.list(this.getParent(path), (e, l) => {
                const ee = path.split("/").pop()
                if (replace || !(e || l.find(e => e.name == ee))) {
                    get(link, async (response) => {
                        ftp.put(response, path, async e => {
                            e && console.log(e)
                        })
                    })
                }
            })
        })
    }
    async test() {

    }
    async uploadFile(file: Express.Multer.File,path:string){
        const ftp = await new Promise(this.getFTP)
        await this.createFolder(path,ftp)
        ftp.rename(file.path,path,this.logger.error)
        return path
    }
    async getFTP(callback:(ftp:Client)=>void){
        console.log(3121)
        const ftp = new Client();
        ftp.connect(ftpConfig)
        ftp.on("ready",()=>{console.log(123);callback(ftp)})
        ftp.on("error",console.log)
    }
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
