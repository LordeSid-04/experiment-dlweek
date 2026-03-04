const test = require("node:test");
const assert = require("node:assert/strict");
const { __test } = require("../src/lib/codex-client");

test("parseModelJson parses fenced JSON output", () => {
  const parsed = __test.parseModelJson("Here is the result:\n```json\n{\"ok\":true,\"count\":2}\n```");
  assert.deepEqual(parsed, { ok: true, count: 2 });
});

test("extractOutputText reads text from structured output parts", () => {
  const payload = {
    output: [
      {
        content: [
          { type: "output_text", text: { value: "{\"summary\":\"done\"}" } },
        ],
      },
    ],
  };
  const text = __test.extractOutputText(payload);
  assert.match(text, /summary/);
});

test("extractOutputParsed returns parsed object from output parts", () => {
  const payload = {
    output: [
      {
        content: [
          { type: "output_text", parsed: { summary: "ok" } },
        ],
      },
    ],
  };
  assert.deepEqual(__test.extractOutputParsed(payload), { summary: "ok" });
});

test("resolveCodexModel prefers explicit Codex model env", () => {
  const prevCodex = process.env.OPENAI_CODEX_MODEL;
  const prevOpenAi = process.env.OPENAI_MODEL;
  process.env.OPENAI_CODEX_MODEL = "gpt-5-codex";
  process.env.OPENAI_MODEL = "gpt-4o-mini";
  try {
    assert.equal(__test.resolveCodexModel(), "gpt-5-codex");
  } finally {
    process.env.OPENAI_CODEX_MODEL = prevCodex;
    process.env.OPENAI_MODEL = prevOpenAi;
  }
});

test("resolveCodexModelCandidates includes fallback chain without duplicates", () => {
  const previous = {
    OPENAI_CODEX_MODEL: process.env.OPENAI_CODEX_MODEL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_AUTOPILOT_FALLBACK_MODEL: process.env.OPENAI_AUTOPILOT_FALLBACK_MODEL,
    OPENAI_PAIR_MODEL: process.env.OPENAI_PAIR_MODEL,
    OPENAI_FAST_MODEL: process.env.OPENAI_FAST_MODEL,
  };
  process.env.OPENAI_CODEX_MODEL = "gpt-5-codex";
  process.env.OPENAI_MODEL = "gpt-4.1-mini";
  process.env.OPENAI_AUTOPILOT_FALLBACK_MODEL = "gpt-4o-mini";
  process.env.OPENAI_PAIR_MODEL = "gpt-4.1-mini";
  process.env.OPENAI_FAST_MODEL = "gpt-4o-mini";
  try {
    assert.deepEqual(__test.resolveCodexModelCandidates(), [
      "gpt-5-codex",
      "gpt-4.1-mini",
      "gpt-4o-mini",
    ]);
  } finally {
    process.env.OPENAI_CODEX_MODEL = previous.OPENAI_CODEX_MODEL;
    process.env.OPENAI_MODEL = previous.OPENAI_MODEL;
    process.env.OPENAI_AUTOPILOT_FALLBACK_MODEL = previous.OPENAI_AUTOPILOT_FALLBACK_MODEL;
    process.env.OPENAI_PAIR_MODEL = previous.OPENAI_PAIR_MODEL;
    process.env.OPENAI_FAST_MODEL = previous.OPENAI_FAST_MODEL;
  }
});
