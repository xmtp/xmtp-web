import type { ConversationProcessors } from "@/helpers/caching/db";

/**
 * Combines all conversation processors into a single object
 *
 * @param conversationProcessors The conversation processors
 * @returns An object that maps namespaces to their respective conversation processors
 */
export const combineConversationProcessors = (
  conversationProcessors: ConversationProcessors[],
) => ({
  ...conversationProcessors.reduce((result, processors) => {
    const update = Object.entries(processors).reduce(
      (updateResult, [namespace, procs]) => ({
        ...updateResult,
        [namespace]: [...(result[namespace] ?? []), ...procs],
      }),
      {} as ConversationProcessors,
    );
    return {
      ...result,
      ...update,
    };
  }, {} as ConversationProcessors),
});
