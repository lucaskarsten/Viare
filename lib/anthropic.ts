import Anthropic from "@anthropic-ai/sdk";

// Singleton Anthropic client shared by all prompt modules.
// SDK default retries transient failures (429/500/529) twice with
// exponential backoff and respects `retry-after` headers — we bump it to 3.
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
    });
  }
  return _client;
}

// Test-only: swap the client (pass null to reset).
export function setAnthropicClient(client: Anthropic | null): void {
  _client = client;
}
