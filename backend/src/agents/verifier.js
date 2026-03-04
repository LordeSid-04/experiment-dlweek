const { callCodex } = require("../lib/codex-client");
const { toStringArray } = require("../lib/normalize");

const VERIFIER_RESPONSE_SCHEMA = {
  name: "verifier_artifact",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      testsToAdd: { type: "array", items: { type: "string" } },
      commands: { type: "array", items: { type: "string" } },
      dryRunResults: { type: "array", items: { type: "string" } },
    },
    required: ["testsToAdd", "commands", "dryRunResults"],
  },
};

async function runVerifierAgent({ userRequest, diffArtifact }) {
  const systemPrompt = [
    "You are VERIFIER in a governed SDLC pipeline.",
    "Output tests and execution evidence only.",
    "Return strict JSON only with keys: testsToAdd, commands, dryRunResults.",
    "Include at least one unit test and at least one runnable verification command.",
  ].join(" ");
  const userPrompt = `Task:\n${userRequest}\n\nDiff artifact:\n${JSON.stringify(diffArtifact, null, 2)}\n\nGenerate test artifact.`;
  const codex = await callCodex({
    agentRole: "VERIFIER",
    systemPrompt,
    userPrompt,
    responseSchema: VERIFIER_RESPONSE_SCHEMA,
  });
  if (!codex.parsed || typeof codex.parsed !== "object") {
    throw new Error("VERIFIER returned invalid structured output.");
  }

  return {
    artifact: {
      testsToAdd: toStringArray(codex.parsed.testsToAdd, []),
      commands: toStringArray(codex.parsed.commands, []),
      dryRunResults: toStringArray(codex.parsed.dryRunResults, []),
    },
    proof: codex.proof,
    modelText: codex.text,
  };
}

module.exports = {
  runVerifierAgent,
};
