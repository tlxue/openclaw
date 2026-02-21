import { describe, expect, test } from "vitest";
import { stripEnvelopeFromMessage, stripMetadataFromMessages } from "./chat-sanitize.js";

describe("stripEnvelopeFromMessage", () => {
  test("removes message_id hint lines from user messages", () => {
    const input = {
      role: "user",
      content: "[WhatsApp 2026-01-24 13:36] yolo\n[message_id: 7b8b]",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("yolo");
  });

  test("removes message_id hint lines from text content arrays", () => {
    const input = {
      role: "user",
      content: [{ type: "text", text: "hi\n[message_id: abc123]" }],
    };
    const result = stripEnvelopeFromMessage(input) as {
      content?: Array<{ type: string; text?: string }>;
    };
    expect(result.content?.[0]?.text).toBe("hi");
  });

  test("does not strip inline message_id text that is part of a line", () => {
    const input = {
      role: "user",
      content: "I typed [message_id: 123] on purpose",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("I typed [message_id: 123] on purpose");
  });

  test("does not strip assistant messages", () => {
    const input = {
      role: "assistant",
      content: "note\n[message_id: 123]",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("note\n[message_id: 123]");
  });
});

describe("stripMetadataFromMessages", () => {
  test("keeps only role, content, text, and timestamp", () => {
    const messages = [
      {
        role: "user",
        content: [{ type: "text", text: "hello" }],
        timestamp: 1700000000000,
        parentId: "abc",
        messageId: "def",
        usage: { input: 10, output: 20 },
        cost: { total: 0.001 },
        model: "gpt-4",
        provider: "openai",
        api: "openai-responses",
        stopReason: "stop",
        __openclaw: { kind: "compaction" },
      },
    ];
    const result = stripMetadataFromMessages(messages) as Array<Record<string, unknown>>;
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: "user",
      content: [{ type: "text", text: "hello" }],
      timestamp: 1700000000000,
    });
  });

  test("preserves text field as alternative to content", () => {
    const messages = [
      {
        role: "assistant",
        text: "hi there",
        timestamp: 1700000000000,
        usage: { input: 5, output: 10 },
      },
    ];
    const result = stripMetadataFromMessages(messages) as Array<Record<string, unknown>>;
    expect(result[0]).toEqual({
      role: "assistant",
      text: "hi there",
      timestamp: 1700000000000,
    });
  });

  test("handles empty array", () => {
    expect(stripMetadataFromMessages([])).toEqual([]);
  });

  test("handles non-object messages", () => {
    const messages = [null, "string", 42];
    const result = stripMetadataFromMessages(messages);
    expect(result).toEqual([null, "string", 42]);
  });
});
