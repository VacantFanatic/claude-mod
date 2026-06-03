/**
 * Builds optional game context to prepend to Claude prompts.
 * Stub implementation — extend later with selected tokens, journals, etc.
 * @returns {{ prefix: string, metadata: Record<string, unknown> }}
 */
export function buildContext() {
  return {
    prefix: "",
    metadata: {},
  };
}
