import { PropOptions } from "@nestjs/mongoose";
import { isPhoneNumber } from "class-validator";

// export const isPhone = (phone)=>isPhoneNumber(phone,"UA")
export const hideTransform:PropOptions<any> = {transform:()=>undefined}
export const defaultTransform:(value:any)=>PropOptions<any> = (value:any)=>({transform:(e:any)=>e??value,default:value})
//@ts-ignore
export const runThreads = <T>(...threads:((()=>{[K in keyof T]?:T[K]})|(()=>void)|(()=>Promise<{[K in keyof T]?:T[K]}>))[]):Promise<T>=>Promise.all(threads.map(th=>new Promise(s=>s(th())))).then(r=>r.reduce((p:any,c:any)=>({...p,...c})))