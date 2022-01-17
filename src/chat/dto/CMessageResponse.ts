type CMessageResponse = {
    id: string;
    time: number;
    message: string;
    user: string;
    readed?: boolean|undefined;
    chat:string;
    file?:string;
    fileType?:"voice"|"image"|"file"
}