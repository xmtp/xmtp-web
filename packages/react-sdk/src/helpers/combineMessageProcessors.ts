import { defaultCacheConfig } from "@/helpers/caching/db";
import type {
  CachedMessageProcessors,
  CacheConfiguration,
} from "@/helpers/caching/db";

/**
 * Combines all message processors into a single object
 *
 * @param cacheConfig The cache configuration to extract the processors from
 * @returns An object that maps content types to their respective message processors
 */
export const combineMessageProcessors = (
  cacheConfig?: CacheConfiguration[],
) => {
  const finalCacheConfig = [...defaultCacheConfig, ...(cacheConfig ?? [])];
  return {
    ...finalCacheConfig.reduce((result, config) => {
      const update = Object.entries(config.processors).reduce(
        (updateResult, [contentType, contentProcessors]) => ({
          ...updateResult,
          [contentType]: [...(result[contentType] ?? []), ...contentProcessors],
        }),
        {} as CachedMessageProcessors,
      );
      return {
        ...result,
        ...update,
      };
    }, {} as CachedMessageProcessors),
  };
};
