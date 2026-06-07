let messageCounter = 0;

/**
 * @param {"user"|"assistant"} role
 * @param {string} content
 * @returns {{ id: string, role: "user"|"assistant", content: string, timestamp: number }}
 */
export function createMessage(role, content) {
  messageCounter += 1;
  return {
    id: `msg-${messageCounter}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

/**
 * @param {Array<{ id: string, role: string, content: string, timestamp: number }>} messages
 * @param {"user"|"assistant"} role
 * @param {string} content
 */
export function appendMessage(messages, role, content) {
  return [...messages, createMessage(role, content)];
}

/**
 * @returns {[]}
 */
export function clearMessages() {
  return [];
}

/**
 * @param {Array<{ role: string, content: string }>} history
 */
export function messagesFromHistory(history) {
  return history
    .filter((entry) => entry.role === "user" || entry.role === "assistant")
    .map((entry) => createMessage(entry.role, entry.content));
}

/**
 * @param {{ scrollTop: number, scrollHeight: number, clientHeight: number }} metrics
 * @param {number} [threshold]
 */
export function shouldScrollToBottom(metrics, threshold = 80) {
  const distanceFromBottom = metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight;
  return distanceFromBottom <= threshold;
}
