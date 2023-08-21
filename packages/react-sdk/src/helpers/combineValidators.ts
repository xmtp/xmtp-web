import { defaultContentTypeConfigs } from "@/helpers/caching/db";
import type {
  ContentTypeMessageValidators,
  ContentTypeConfiguration,
} from "@/helpers/caching/db";

/**
 * Combines all content validators into a single object
 *
 * @param contentTypeConfigs The content types configuration to extract the content validators from
 * @returns An object that maps content types to their respective content validator
 */
export const combineValidators = (
  contentTypeConfigs?: ContentTypeConfiguration[],
) => {
  // merge default config with passed in config
  const finalCacheConfig = [
    ...defaultContentTypeConfigs,
    ...(contentTypeConfigs ?? []),
  ];
  // array of validator content types for detecting duplicates
  const validatorContentTypes: string[] = [];
  return finalCacheConfig.reduce((result, config) => {
    const validators: ContentTypeMessageValidators = {};
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
  }, {} as ContentTypeMessageValidators);
};
