const test = require("node:test");
const assert = require("node:assert/strict");
const { getDirectModelTuning } = require("../src/lib/direct-assist");

test("getDirectModelTuning returns speed-oriented defaults", () => {
  delete process.env.DIRECT_CONTEXT_FILES_ASSIST;
  delete process.env.DIRECT_CONTEXT_FILES_PAIR;
  delete process.env.DIRECT_CONTEXT_LINES_ASSIST;
  delete process.env.DIRECT_CONTEXT_LINES_PAIR;
  delete process.env.DIRECT_TOKEN_SCAN_CHARS_ASSIST;
  delete process.env.DIRECT_TOKEN_SCAN_CHARS_PAIR;
  delete process.env.DIRECT_MAX_OUTPUT_TOKENS_ASSIST;
  delete process.env.DIRECT_MAX_OUTPUT_TOKENS_PAIR;

  const assist = getDirectModelTuning(0);
  assert.deepEqual(assist, {
    maxContextFiles: 2,
    maxContextLines: 70,
    contentTokenScanChars: 1000,
    maxOutputTokens: 600,
  });

  const pair = getDirectModelTuning(50);
  assert.deepEqual(pair, {
    maxContextFiles: 3,
    maxContextLines: 100,
    contentTokenScanChars: 1400,
    maxOutputTokens: 900,
  });
});

test("getDirectModelTuning uses valid env overrides and ignores invalid values", () => {
  process.env.DIRECT_CONTEXT_FILES_ASSIST = "4";
  process.env.DIRECT_CONTEXT_LINES_ASSIST = "88";
  process.env.DIRECT_TOKEN_SCAN_CHARS_ASSIST = "1600";
  process.env.DIRECT_MAX_OUTPUT_TOKENS_ASSIST = "700";
  process.env.DIRECT_CONTEXT_FILES_PAIR = "0";
  process.env.DIRECT_CONTEXT_LINES_PAIR = "-1";
  process.env.DIRECT_TOKEN_SCAN_CHARS_PAIR = "not-a-number";
  process.env.DIRECT_MAX_OUTPUT_TOKENS_PAIR = "950";

  const assist = getDirectModelTuning(0);
  assert.deepEqual(assist, {
    maxContextFiles: 4,
    maxContextLines: 88,
    contentTokenScanChars: 1600,
    maxOutputTokens: 700,
  });

  const pair = getDirectModelTuning(50);
  assert.deepEqual(pair, {
    maxContextFiles: 3,
    maxContextLines: 100,
    contentTokenScanChars: 1400,
    maxOutputTokens: 950,
  });
});
