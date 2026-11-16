import test from 'node:test';
import assert from 'node:assert/strict';
import {activeHydraConnection} from '../lib/hydra-config.mjs';

test('uses the existing local HTTP settings by default', () => {
  assert.deepEqual(activeHydraConnection({HYDRADB_HTTP_URL:'https://local.example',HYDRADB_AUTH_TOKEN:'original'}),{
    target:'local',url:'https://local.example',token:'original',transport:'http'
  });
});
test('selects Render without mixing local URL and token', () => {
  assert.deepEqual(activeHydraConnection({
    HYDRADB_ACTIVE_TARGET:'render',HYDRADB_RENDER_URL:'https://render.example',HYDRADB_RENDER_AUTH_TOKEN:'render-secret',
    HYDRADB_HTTP_URL:'https://local.example',HYDRADB_AUTH_TOKEN:'local-secret'
  }),{target:'render',url:'https://render.example',token:'render-secret',transport:'http'});
});
test('rejects incomplete Render configuration instead of silently falling back', () => {
  assert.throws(()=>activeHydraConnection({HYDRADB_ACTIVE_TARGET:'render',HYDRADB_RENDER_URL:'https://render.example'}),/requires HYDRADB_RENDER_URL and HYDRADB_RENDER_AUTH_TOKEN/);
});
test('rejects unknown targets', () => {
  assert.throws(()=>activeHydraConnection({HYDRADB_ACTIVE_TARGET:'other'}),/must be local or render/);
});
test('preserves Bolt-only local setup', () => {
  assert.equal(activeHydraConnection({}).transport,'bolt');
});
