// Choose one database for both reads and writes. Never silently fail over:
// local and Render may contain different graph records.
export function activeHydraConnection(env = process.env) {
  const target = (env.HYDRADB_ACTIVE_TARGET || 'local').trim().toLowerCase();
  if (target !== 'local' && target !== 'render') {
    throw new Error('HYDRADB_ACTIVE_TARGET must be local or render');
  }
  if (target === 'render') {
    const url = env.HYDRADB_RENDER_URL?.trim();
    const token = env.HYDRADB_RENDER_AUTH_TOKEN?.trim();
    if (!url || !token) {
      throw new Error('Render HydraDB requires HYDRADB_RENDER_URL and HYDRADB_RENDER_AUTH_TOKEN');
    }
    return {target, url, token, transport:'http'};
  }
  const url = env.HYDRADB_HTTP_URL?.trim();
  return {target, url, token:env.HYDRADB_AUTH_TOKEN?.trim(), transport:url?'http':'bolt'};
}
