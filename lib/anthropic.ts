import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

// Anthropic client — used only in server-side API routes, never on the client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;

/**
 * Call Claude and force a structured result via tool use, bypassing text parsing.
 * Claude MUST call the named tool, so the response is always valid JSON.
 */
export async function callClaudeWithTool<T>(
  prompt: string,
  toolName: string,
  schema: Tool.InputSchema,
  maxTokens = 4096
): Promise<T> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: maxTokens,
    tools: [
      {
        name: toolName,
        description: `Submit the ${toolName.replace(/_/g, " ")} result`,
        input_schema: schema,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: prompt }],
  });

  const toolBlock = message.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a structured result. Please try again.");
  }
  return toolBlock.input as T;
}
