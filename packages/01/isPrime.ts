const cache: Set<number> = new Set([1, 3]);

export function isPrime(num: number) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 == 0 || num % 3 == 0) return false;
  if (cache.has(num)) return true;

  for (let i = 5; i * i <= num; i = i + 6) {
    if (num % i == 0 || num % (i + 2) == 0) return false;
  }

  cache.add(num);
  return true;
}
