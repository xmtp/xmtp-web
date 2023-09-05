import { defaultContentTypeConfigs } from "@/helpers/caching/db";
import type {
  ContentTypeMessageProcessors,
  ContentTypeConfiguration,
} from "@/helpers/caching/db";

/**
 * Combines all message processors into a single object
 *
 * @param contentTypeConfigs The content types configuration to extract the processors from
 * @returns An object that maps content types to their respective message processors
 */
export const combineMessageProcessors = (
  contentTypeConfigs?: ContentTypeConfiguration[],
) => {
  const finalCacheConfig = [
    ...defaultContentTypeConfigs,
    ...(contentTypeConfigs ?? []),
  ];
  return {
    ...finalCacheConfig.reduce((result, config) => {
      const update = Object.entries(config.processors ?? []).reduce(
        (updateResult, [contentType, contentProcessors]) => ({
          ...updateResult,
          [contentType]: [...(result[contentType] ?? []), ...contentProcessors],
        }),
        {} as ContentTypeMessageProcessors,
      );
      return {
        ...result,
        ...update,
      };
    }, {} as ContentTypeMessageProcessors),
  };
};
