export function log(...args: unknown[]) {
  const hrTime = process.hrtime();
  console.log(hrTime.join('.'), args.join(' '));
}
