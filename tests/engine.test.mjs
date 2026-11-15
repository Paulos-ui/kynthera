import test from 'node:test';import assert from 'node:assert/strict';import {rank,updateFeedback,benchmark,overlap} from '../lib/engine.mjs';
test('exact signature ranks above unrelated',()=>{const i={signature:'npm eresolve react dependency conflict',environment:'Node.js'};const s=[{id:'unrelated',signature:'database timeout pool exhausted',environment:'Python',successes:0,failures:0},{id:'match',signature:'npm eresolve react dependency conflict',environment:'Node.js',successes:1,failures:0}];assert.equal(rank(i,s)[0].strategy.id,'match')});
test('verified outcomes update success/failure counters',()=>{const s={successes:2,failures:1};assert.deepEqual(updateFeedback(s,true),{successes:3,failures:1});assert.deepEqual(updateFeedback(s,false),{successes:2,failures:2})});
test('empty replay avoids false accuracy claims',()=>{assert.equal(benchmark([],[]).top1,null)});
test('empty overlap is zero',()=>{assert.equal(overlap('','test'),0)});
