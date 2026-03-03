const test = require("node:test");
const assert = require("node:assert/strict");
const { getQuickAssistSuggestion } = require("../src/lib/quick-assist");

test("quick assist detects square mismatch and suggests exponentiation", async () => {
  const result = await getQuickAssistSuggestion({
    question: "why does this code not return the required output? im trying to square input",
    selectedFile: "test.py",
    selectedCode: "def square(x):\n  return x * 2",
    fileContent: "def square(x):\n  return x * 2\nprint(square(3))",
  });
  assert.match(result.suggestion, /doubling/i);
  assert.match(result.suggestion, /\*\* 2/);
  assert.match(result.relevantSnippet, /return x \* 2/);
});

test("quick assist detects square mismatch from code in question", async () => {
  const result = await getQuickAssistSuggestion({
    question: [
      "why is this not squaring?",
      "def square(x):",
      "  return x * 2",
      "print(square(3))",
    ].join("\n"),
  });
  assert.match(result.suggestion, /doubling/i);
  assert.match(result.suggestion, /\*\* 2/);
});

test("quick assist detects inverted even-check logic", async () => {
  const result = await getQuickAssistSuggestion({
    question: "why is my even check wrong?",
    selectedCode: "def is_even(x):\n  return x % 2 == 1",
  });
  assert.match(result.suggestion, /inverted/i);
  assert.match(result.suggestion, /% 2 == 0/);
});

test("quick assist fallback asks for concrete context when broad", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const result = await getQuickAssistSuggestion({
      question: "Can you explain this issue?",
    });
    assert.match(result.suggestion, /expected behavior/i);
    assert.match(result.suggestion, /actual output/i);
  } finally {
    process.env.OPENAI_API_KEY = originalKey;
  }
});
