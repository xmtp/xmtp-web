import { defaultCacheConfig } from "@/helpers/caching/db";
import type {
  CachedMessageValidators,
  CacheConfiguration,
} from "@/helpers/caching/db";

/**
 * Combines all content validators into a single object
 *
 * @param cacheConfig The cache configuration to extract the content validators from
 * @returns An object that maps content types to their respective content validator
 */
export const combineValidators = (cacheConfig?: CacheConfiguration[]) => {
  // merge default config with passed in config
  const finalCacheConfig = [...defaultCacheConfig, ...(cacheConfig ?? [])];
  // array of validator content types for detecting duplicates
  const validatorContentTypes: string[] = [];
  return finalCacheConfig.reduce((result, config) => {
    const validators: CachedMessageValidators = {};
    // prevent duplicate content type validators
    Object.entries(config.validators ?? {}).forEach(
      ([contentType, validator]) => {
        if (validatorContentTypes.includes(contentType)) {
          throw new Error(
            `Duplicate content validator detected for content type "${contentType}"`,
          );
        }
        validatorContentTypes.push(contentType);
        validators[contentType] = validator;
      },
    );
    return {
      ...result,
      ...validators,
    };
  }, {} as CachedMessageValidators);
};
