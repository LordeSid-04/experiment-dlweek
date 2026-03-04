const test = require("node:test");
const assert = require("node:assert/strict");
const { getQuickAssistSuggestion } = require("../src/lib/quick-assist");

test("quick assist returns OpenAI structured suggestion", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      output_parsed: {
        suggestion: "Your square function doubles input; use `return x ** 2`.",
        rationale: "Squaring requires exponentiation.",
        relevantSnippet: "return x * 2",
      },
    }),
  });
  try {
    const result = await getQuickAssistSuggestion({
      question: "why does this code not return the required output? im trying to square input",
      selectedFile: "test.py",
      selectedCode: "def square(x):\n  return x * 2",
      fileContent: "def square(x):\n  return x * 2\nprint(square(3))",
    });
    assert.match(result.suggestion, /\*\* 2/);
    assert.match(result.relevantSnippet, /return x \* 2/);
  } finally {
    process.env.OPENAI_API_KEY = originalKey;
    global.fetch = originalFetch;
  }
});

test("quick assist throws when OPENAI key is missing", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await assert.rejects(
      getQuickAssistSuggestion({ question: "Can you explain this issue?" }),
      /OPENAI_API_KEY is missing/i
    );
  } finally {
    process.env.OPENAI_API_KEY = originalKey;
  }
});
