export function error(...args: string[]) {
  console.log('ERROR ::', args.join(' :: '));
}

export function info(...args: string[]) {
  console.log('INFO ::', args.join(' :: '));
}

export function warn(...args: string[]) {
  console.log('WARN ::', args.join(' :: '));
}
