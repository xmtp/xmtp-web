import type { ContentCodec } from "@xmtp/xmtp-js";
import {
  defaultCacheConfig,
  type CacheConfiguration,
} from "@/helpers/caching/db";

/**
 * Formats all codecs into a simple array
 *
 * @param cacheConfig The cache configuration to extract the codecs from
 * @returns An array of codecs
 */
export const combineCodecs = (cacheConfig?: CacheConfiguration[]) => {
  const finalCacheConfig = [...defaultCacheConfig, ...(cacheConfig ?? [])];
  return finalCacheConfig.reduce(
    (result, config) => [...result, ...(config.codecs ?? [])],
    [] as ContentCodec<any>[],
  );
};
