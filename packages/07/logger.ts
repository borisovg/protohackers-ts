export const logger = {
  debug(...args: unknown[]) {
    console.log('DEBUG ::', args.join(' :: '));
  },

  error(...args: unknown[]) {
    console.log('ERROR ::', args.join(' :: '));
  },

  info(...args: unknown[]) {
    console.log('INFO  ::', args.join(' :: '));
  },

  warn(...args: unknown[]) {
    console.log('WARN  ::', args.join(' :: '));
  },
};
