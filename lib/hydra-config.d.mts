export function activeHydraConnection(env?: NodeJS.ProcessEnv): {
  target: 'local' | 'render';
  url: string | undefined;
  token: string | undefined;
  transport: string;
};
