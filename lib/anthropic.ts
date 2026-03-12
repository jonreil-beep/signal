import Anthropic from "@anthropic-ai/sdk";

// Anthropic client — used only in server-side API routes, never on the client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;
