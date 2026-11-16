import {createHash} from 'node:crypto';
import neo4j, {type Driver, type Session} from 'neo4j-driver';
import type {Incident, Strategy, Store} from './types';
import {activeHydraConnection} from './hydra-config.mjs';

type Kind = 'KIncident' | 'KStrategy' | 'KEvent';
type Event = Store['events'][number];
type RawStrategy = Omit<Strategy, 'steps'> & {steps: string};

// HTTP transport for HTTPS tunnels and hosted HydraDB. Same OpenCypher queries as Bolt.
// Never call this endpoint from a browser; the token belongs exclusively on the server.
type HttpCell = {type: string;value?: unknown};
type HttpResult = {query_id?: string;columns?: string[];rows?: HttpCell[][];next_cursor?: unknown;error?: {message?: string;code?: string}};
const usingHttp = () => activeHydraConnection().transport === 'http';
function decodeCell(cell:HttpCell):unknown {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'list' && Array.isArray(cell.value)) return cell.value.map(v=>decodeCell(v as HttpCell));
  return cell.value ?? null;
}
async function httpQuery(query:string,parameters:Record<string,unknown>={}):Promise<Record<string,unknown>[]> {
  const connection=activeHydraConnection();
  const base=(connection.url||'').replace(/\/+$/,'');
  const token=connection.token;
  if(!base||!token) throw Error(`HydraDB ${connection.target} HTTP URL and authentication token must both be configured`);
  if(!/^https:\/\//i.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base))
    throw Error('A remote HydraDB HTTP URL must use HTTPS');
  const graph=process.env.HYDRADB_DATABASE||'default';
  const url=`${base}/v1/graphs/${encodeURIComponent(graph)}/query`;
  const results:Record<string,unknown>[]=[];
  let cursor:unknown=undefined,queryId:string|undefined;
  for(let page=0;page<50;page++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    let response:Response;
    try {
      response=await fetch(url,{method:'POST',headers:{'Authorization':`Bearer ${token}`,'X-Graph-Namespace':process.env.HYDRADB_NAMESPACE||'default','Content-Type':'application/json'},
        body:JSON.stringify({cell_id:process.env.HYDRADB_CELL_ID||'cell-0',query,parameters,page_size:512,
          ...(cursor!==undefined?{cursor,query_id:queryId}:{})}),cache:'no-store',signal:controller.signal});
    } catch (error) {
      throw Error(`HydraDB HTTP transport failed: ${error instanceof Error?error.message:String(error)}`);
    } finally {clearTimeout(timer)}
    let payload:HttpResult;
    try {payload=await response.json() as HttpResult} catch {throw Error(`HydraDB returned non-JSON HTTP ${response.status}`)}
    if (!response.ok||payload.error) throw Error(`HydraDB HTTP ${response.status}: ${payload.error?.message||payload.error?.code||'Query failed'}`);
    if(!Array.isArray(payload.columns)||!Array.isArray(payload.rows)) throw Error('Unexpected HydraDB HTTP response shape');
    for(const record of payload.rows){
      const row:Record<string,unknown>={};
      payload.columns.forEach((column,index)=>{row[column]=decodeCell(record[index])});
      results.push(row);
    }
    if(payload.next_cursor===null||payload.next_cursor===undefined)return results;
    cursor=payload.next_cursor; queryId=payload.query_id;
  }
  throw Error('HydraDB pagination exceeded the safety limit');
}


// HydraDB uses numeric id as the graph identity. Kynthera's UUID stays in externalId.
// Include the owner and node type so separate accounts never share a graph identity.
export function graphId(owner:string, kind:Kind, externalId:string):number {
  return createHash('sha256').update(`${owner}:${kind}:${externalId}`).digest().readUIntBE(0,6);
}
const driver = ():Driver => neo4j.driver(
  process.env.HYDRADB_BOLT_URL || 'bolt://127.0.0.1:7687',
  neo4j.auth.basic(process.env.HYDRADB_USERNAME || 'neo4j',process.env.HYDRADB_PASSWORD || '')
);
const session = (d:Driver):Session => d.session({database:process.env.HYDRADB_DATABASE || 'default'});

const projections:Record<Kind,string> = {
  KIncident:'n.externalId AS id, n.title AS title, n.signature AS signature, n.environment AS environment, n.service AS service, n.severity AS severity, n.status AS status, n.description AS description, n.createdAt AS createdAt, n.strategyId AS strategyId, n.outcome AS outcome',
  KStrategy:'n.externalId AS id, n.name AS name, n.signature AS signature, n.environment AS environment, n.description AS description, n.steps AS steps, n.successes AS successes, n.failures AS failures, n.createdAt AS createdAt',
  KEvent:'n.externalId AS id, n.type AS type, n.message AS message, n.createdAt AS createdAt'
};
// Special UNWIND vertex-upsert form required by HydraDB's current Cypher subset.
const upserts:Record<Kind,string> = {
  KIncident:'UNWIND $rows AS row MERGE (n {id: row.id}) SET n:KIncident, n.owner = row.owner, n.externalId = row.externalId, n.title = row.title, n.signature = row.signature, n.environment = row.environment, n.service = row.service, n.severity = row.severity, n.status = row.status, n.description = row.description, n.createdAt = row.createdAt, n.strategyId = row.strategyId, n.outcome = row.outcome',
  KStrategy:'UNWIND $rows AS row MERGE (n {id: row.id}) SET n:KStrategy, n.owner = row.owner, n.externalId = row.externalId, n.name = row.name, n.signature = row.signature, n.environment = row.environment, n.description = row.description, n.steps = row.steps, n.successes = row.successes, n.failures = row.failures, n.createdAt = row.createdAt',
  KEvent:'UNWIND $rows AS row MERGE (n {id: row.id}) SET n:KEvent, n.owner = row.owner, n.externalId = row.externalId, n.type = row.type, n.message = row.message, n.createdAt = row.createdAt'
};
function values<T>(result:{records: {keys:(string|number)[];get(key:string|number):unknown}[]}):T[] {
  return result.records.map(record=>{
    const output:Record<string,unknown> = {};
    for (const key of record.keys) {
      const value=record.get(key);
      output[String(key)]=neo4j.isInt(value)?value.toNumber():value;
    }
    return output as T;
  });
}
export async function hydraRead(owner:string):Promise<Store> {
  if(usingHttp()) {
    const incidents=await httpQuery(`MATCH (n:KIncident {owner: $owner}) RETURN ${projections.KIncident}`,{owner}) as unknown as Incident[];
    const rawStrategies=await httpQuery(`MATCH (n:KStrategy {owner: $owner}) RETURN ${projections.KStrategy}`,{owner}) as unknown as RawStrategy[];
    const events=await httpQuery(`MATCH (n:KEvent {owner: $owner}) RETURN ${projections.KEvent}`,{owner}) as unknown as Event[];
    const strategies=rawStrategies.map(v=>({...v,steps:v.steps?JSON.parse(v.steps):[],successes:Number(v.successes)||0,failures:Number(v.failures)||0}));
    for(const incident of incidents){if(!incident.strategyId)delete incident.strategyId;if(!incident.outcome)delete incident.outcome;}
    return {incidents,strategies,events};
  }
  const d=driver(),s=session(d);
  try {
    const incidents=values<Incident>(await s.run(`MATCH (n:KIncident {owner: $owner}) RETURN ${projections.KIncident}`,{owner}));
    const rawStrategies=values<RawStrategy>(await s.run(`MATCH (n:KStrategy {owner: $owner}) RETURN ${projections.KStrategy}`,{owner}));
    const events=values<Event>(await s.run(`MATCH (n:KEvent {owner: $owner}) RETURN ${projections.KEvent}`,{owner}));
    const strategies:Strategy[]=rawStrategies.map(v=>({...v,steps:v.steps?JSON.parse(v.steps):[],successes:Number(v.successes)||0,failures:Number(v.failures)||0}));
    for(const incident of incidents){
      if(!incident.strategyId) delete incident.strategyId;
      if(!incident.outcome) delete incident.outcome;
    }
    return {incidents,strategies,events};
  } finally {await s.close();await d.close()}
}
function row(kind:Kind,value:Incident|Strategy|Event,owner:string){
  const base={...value,id:graphId(owner,kind,value.id),externalId:value.id,owner};
  if(kind==='KIncident') return {...base,strategyId:(value as Incident).strategyId||'',outcome:(value as Incident).outcome||''};
  if(kind==='KStrategy') return {...base,steps:JSON.stringify((value as Strategy).steps||[])};
  return base;
}
export async function hydraUpsert(kind:Kind,value:Incident|Strategy|Event,owner:string):Promise<void> {
  if(usingHttp()) {
    await httpQuery(upserts[kind],{rows:[row(kind,value,owner)]});
    if(kind==='KIncident'&&(value as Incident).strategyId){
      const incident=value as Incident;
      await httpQuery('MERGE (i {id: $incidentId})-[:RECOVERED_WITH]->(r {id: $strategyId})',{
        incidentId:graphId(owner,'KIncident',incident.id),
        strategyId:graphId(owner,'KStrategy',incident.strategyId!)
      });
    }
    return;
  }
  const d=driver(),s=session(d);
  try {
    await s.run(upserts[kind],{rows:[row(kind,value,owner)]});
    if(kind==='KIncident'&&(value as Incident).strategyId){
      const incident=value as Incident;
      await s.run('MERGE (i {id: $incidentId})-[:RECOVERED_WITH]->(r {id: $strategyId})',{
        incidentId:graphId(owner,'KIncident',incident.id),
        strategyId:graphId(owner,'KStrategy',incident.strategyId!)
      });
    }
  } finally {await s.close();await d.close()}
}
export async function hydraHealth():Promise<boolean>{
  if(usingHttp()) {await httpQuery('MATCH (n:KIncident) RETURN count(n.id) AS total');return true;}
  const d=driver(),s=session(d);
  try {
    await d.verifyConnectivity();
    await s.run('MATCH (n:KIncident) RETURN count(n.id) AS total');
    return true;
  } finally {await s.close();await d.close()}
}
