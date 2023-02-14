import { Site } from './site';

const sites: Record<number, Site> = {};

export function updateCounts(
  site: number,
  list: { count: number; species: string }[]
) {
  if (!sites[site]) {
    sites[site] = new Site(site);
  }

  sites[site].updateCounts(list);
}
