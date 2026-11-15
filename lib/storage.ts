import {promises as fs} from 'node:fs';import path from 'node:path';import type {Store} from './types';
const file=(owner:string)=>path.join(process.cwd(),'.data',owner+'.json');
let queue=Promise.resolve();
export async function readLocal(owner:string):Promise<Store>{try{return JSON.parse(await fs.readFile(file(owner),'utf8')) as Store}catch(e:any){if(e.code!=='ENOENT')throw e;return {incidents:[],strategies:[],events:[]}}}
export async function writeLocal(owner:string,data:Store){await fs.mkdir(path.dirname(file(owner)),{recursive:true});const tmp=file(owner)+'.tmp';await fs.writeFile(tmp,JSON.stringify(data,null,2));await fs.rename(tmp,file(owner))}
export async function transactLocal<T>(owner:string,fn:(data:Store)=>Promise<T>|T):Promise<T>{const operation=queue.then(async()=>{const d=await readLocal(owner);const result=await fn(d);await writeLocal(owner,d);return result});queue=operation.then(()=>{},()=>{});return operation}
