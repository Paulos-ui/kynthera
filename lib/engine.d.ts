import type {Incident,Strategy,Recommendation} from './types';
export function rank(i:Incident,s:Strategy[]):Recommendation[];
export function updateFeedback(s:Strategy,success:boolean):Strategy;
export function benchmark(i:Incident[],s:Strategy[]):{total:number;top1:number|null;rows:{id:string;title:string;expected:string;predicted:string|null;hit:boolean;score:number}[];note:string};
