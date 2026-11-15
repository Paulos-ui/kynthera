export type Status='open'|'resolved'|'investigating';
export type Incident={id:string;title:string;signature:string;environment:string;service:string;severity:'critical'|'high'|'medium'|'low';status:Status;description:string;createdAt:string;strategyId?:string;outcome?:'success'|'failure'};
export type Strategy={id:string;name:string;signature:string;environment:string;description:string;steps:string[];successes:number;failures:number;createdAt:string};
export type Store={incidents:Incident[];strategies:Strategy[];events:{id:string;type:string;message:string;createdAt:string}[]};
export type Recommendation={strategy:Strategy;score:number;reasons:string[]};
