import {
  defaultContentTypeConfigs,
  type ContentTypeConfiguration,
} from "@/helpers/caching/db";

/**
 * Combines all namespaces into a single object
 *
 * @param contentTypeConfigs The content types configuration to extract the namespaces from
 * @returns An object that maps content types to their respective namespace
 */
export const combineNamespaces = (
  contentTypeConfigs?: ContentTypeConfiguration[],
) => {
  // merge default config with passed in config
  const finalCacheConfig = [
    ...defaultContentTypeConfigs,
    ...(contentTypeConfigs ?? []),
  ];
  // array of namespaces for detecting duplicates
  const namespaces: string[] = [];
  return finalCacheConfig.reduce(
    (result, config) => {
      // prevent duplicate namespaces
      if (namespaces.includes(config.namespace)) {
        throw new Error(
          `Duplicate content types config namespace detected: "${config.namespace}"`,
        );
      }
      namespaces.push(config.namespace);
      // assign namespaces to content types
      const names = (config.contentTypes ?? []).reduce(
        (namespacesResult, contentType) => ({
          ...namespacesResult,
          [contentType]: config.namespace,
        }),
        {} as Record<string, string>,
      );
      return {
        ...result,
        ...names,
      };
    },
    {} as Record<string, string>,
  );
};
