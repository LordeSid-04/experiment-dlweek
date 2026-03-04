const test = require("node:test");
const assert = require("node:assert/strict");
const { runPipeline, streamPipeline } = require("../src/orchestrator");

const originalFetch = global.fetch;
const originalOpenAiKey = process.env.OPENAI_API_KEY;

function buildMockOutput(name, userText = "") {
  if (name === "architect_artifact") {
    return {
      systemComponents: ["api", "governor", "developer"],
      filesToTouch: ["src/app/page.tsx"],
      constraints: ["security scan required"],
      riskForecast: { pii: false, auth: true, destructiveOps: false, notes: ["verify policy gates"] },
    };
  }
  if (name === "developer_artifact") {
    const lower = String(userText).toLowerCase();
    const isChatbot = lower.includes("chatbot");
    const isWebsite = lower.includes("website");
    const generatedFiles = isChatbot
      ? {
          "src/app/page.tsx": "export default function Page(){return <main><h1>AI Chatbot</h1><p>responsive chat assistant</p></main>;}",
          "src/app/layout.tsx": "export default function RootLayout({children}){return <html><body>{children}</body></html>}",
          "src/app/globals.css": "@media (max-width: 760px){main{padding:12px;}}",
          "preview/index.html": "<!doctype html><html><body><h1>AI Chatbot</h1></body></html>",
        }
      : isWebsite
        ? {
            "src/app/page.tsx": "export default function Page(){return <main><h1>Company Website</h1><section>services</section><section>about</section><section>contact</section><section>testimonials</section></main>;}",
            "src/app/layout.tsx": "export default function RootLayout({children}){return <html><body>{children}</body></html>}",
            "src/app/globals.css": "body{margin:0;} @media (max-width:760px){main{padding:12px;}}",
            "preview/index.html": "<!doctype html><html><body><h1>Company Website</h1><p>services about contact testimonials</p></body></html>",
          }
        : {
            "src/app/page.tsx": "export default function Page(){return <h1>Hello</h1>;}",
            "src/app/layout.tsx": "export default function RootLayout({children}){return <html><body>{children}</body></html>}",
            "src/app/globals.css": "body{margin:0;}",
          };
    const assistantReply = isChatbot
      ? "Built an AI chatbot implementation with responsive chat assistant flows."
      : isWebsite
        ? "Built a company website implementation with services, about, contact, and testimonials."
        : "Implemented requested change.";
    return {
      unifiedDiff: "diff --git a/src/app/page.tsx b/src/app/page.tsx\n+++ b/src/app/page.tsx\n+export default function Page(){return <h1>Hello</h1>;}",
      filesTouched: Object.keys(generatedFiles),
      rationale: "Generated a minimal implementation.",
      generatedFiles,
      previewHtml: "<!doctype html><html><body><h1>Hello</h1></body></html>",
      assistantReply,
    };
  }
  if (name === "developer_knowledge_response") {
    return {
      assistantReply: "This is a direct knowledge response tailored to the request.",
      rationale: "Provided concise explanation with verification guidance.",
    };
  }
  if (name === "verifier_artifact") {
    return {
      testsToAdd: ["unit test for page render"],
      commands: ["npm test"],
      dryRunResults: ["tests planned"],
    };
  }
  if (name === "operator_artifact") {
    return {
      deployPlan: ["deploy staging"],
      rolloutSteps: ["canary 10%", "rollout 100%"],
      rollbackPlan: ["revert release"],
      readinessChecks: ["tests pass"],
    };
  }
  return { summary: "ok" };
}

test.before(() => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options?.body || "{}");
    const schemaName = body?.text?.format?.name;
    const userText =
      body?.input?.find((item) => item?.role === "user")?.content?.[0]?.text || "";
    if (schemaName) {
      const parsed = buildMockOutput(schemaName, userText);
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ id: `mock-${schemaName}`, output_parsed: parsed, output_text: JSON.stringify(parsed) }),
      };
    }
    const directPayload = {
      assistantReply: "Scoped guidance generated. Replace `return x * 2` with `return x ** 2`.",
      rationale: "Produced from direct OpenAI path.",
      unifiedDiff: "",
      generatedFiles: {
        "src/math.py": "def square(x):\n  return x ** 2\nprint(square(3))",
      },
      citations: ["Context file: src/example.ts"],
    };
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ id: "mock-direct", output_text: JSON.stringify(directPayload) }),
    };
  };
});

test.after(() => {
  global.fetch = originalFetch;
  process.env.OPENAI_API_KEY = originalOpenAiKey;
});

test("pipeline returns timeline with governor proof metadata", async () => {
  const result = await runPipeline({
    prompt: "Add auth guard and risk checks to API pipeline",
    actor: "test-user",
    confidenceMode: "autopilot",
    confidencePercent: 100,
    approvals: [
      { approverId: "alice", approvedAt: new Date().toISOString() },
      { approverId: "bob", approvedAt: new Date().toISOString() },
    ],
  });

  assert.ok(result.runId);
  assert.ok(Array.isArray(result.timeline));
  assert.ok(result.timeline.length >= 2);
  assert.ok(Array.isArray(result.proofs));
  assert.ok(result.proofs.every((item) => item.proof.provider));
  assert.ok(result.gate.riskCard);
  assert.ok(Array.isArray(result.gate.riskCard.requiredControls));
  assert.ok(result.gate.riskFactors);
  assert.ok(typeof result.gate.findingsByCategory === "object");
});

test("pipeline emits usable diff lines for generated files", async () => {
  const result = await runPipeline({
    prompt: "Fix the bug in src/math.ts and provide a patch",
    actor: "test-user",
    confidenceMode: "autopilot",
    confidencePercent: 100,
    projectFiles: {
      "src/math.ts": "export function square(x:number){return x * 2;}",
    },
  });

  assert.ok(Array.isArray(result.diffLines));
  assert.ok(result.diffLines.length > 0);
  assert.ok(result.diffLines.some((line) => line.content.trim().length > 0));
  assert.ok(
    result.diffLines.some(
      (line) => line.kind === "add" || line.content.includes("diff --git") || line.content.includes("+++")
    )
  );
});

test("pipeline uses direct non-agent path at 0 percent", async () => {
  const result = await runPipeline({
    prompt: "Explain this function and suggest a tiny fix. Also check for token logging risk.",
    actor: "test-user",
    confidenceMode: "assist",
    confidencePercent: 0,
    projectFiles: {
      "src/example.ts": "export function square(x:number){ return x * 2; }\nconsole.log(headers.authorization);",
    },
  });

  assert.ok(result.runId);
  assert.equal(result.blocked, false);
  assert.ok(Array.isArray(result.proofs));
  assert.equal(result.proofs.length, 1);
  assert.equal(result.proofs[0].proof.agentRole, "DEVELOPER");
  assert.ok(Array.isArray(result.gate.reasonCodes));
  assert.ok(typeof result.gate.riskScore === "number");
  assert.ok(Array.isArray(result.findings));
  assert.ok(result.artifacts?.diff?.contentFlags !== undefined);
});

test("pipeline uses direct non-agent path at 50 percent", async () => {
  const result = await runPipeline({
    prompt: "Propose a patch to fix this bug safely",
    actor: "test-user",
    confidenceMode: "pair",
    confidencePercent: 50,
    projectFiles: {
      "src/math.ts": "export function cube(x:number){ return x * 3; }",
    },
  });

  assert.ok(result.runId);
  assert.equal(result.blocked, false);
  assert.ok(Array.isArray(result.timeline));
  assert.equal(result.timeline.length, 1);
  assert.ok(Array.isArray(result.gate.reasonCodes));
  assert.ok(typeof result.gate.riskScore === "number");
});

test("pair direct mode returns scoped fix artifact for selected function correction", async () => {
  const scopedPrompt = [
    "Execution mode: Pair (50%)",
    "Selected file: src/math.py",
    "Selected text scope:",
    "```",
    "def square(x):",
    "  return x * 2",
    "```",
    "",
    "User request: generate corrected version of this function",
  ].join("\n");

  const result = await runPipeline({
    prompt: scopedPrompt,
    actor: "test-user",
    confidenceMode: "pair",
    confidencePercent: 50,
    projectFiles: {
      "src/math.py": "def square(x):\n  return x * 2\nprint(square(3))",
    },
  });

  const files = result.artifacts?.diff?.generatedFiles || {};
  assert.ok(Object.keys(files).length >= 1);
  assert.ok(String(files["src/math.py"] || "").includes("** 2"));
});

test("stream pipeline emits lifecycle events in direct assist mode", async () => {
  const seenEventTypes = [];
  await streamPipeline({
    prompt: "Change auth middleware and add deployment script",
    actor: "test-user",
    confidenceMode: "assist",
    approvals: [],
    confidencePercent: 70,
    breakGlass: {
      reason: "Emergency mitigation",
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      postActionReviewRequired: true,
    },
    projectFiles: {},
    emitEvent: (event) => {
      seenEventTypes.push(event.type);
    },
  });
  assert.ok(seenEventTypes.includes("run_started"));
  assert.ok(seenEventTypes.includes("run_completed"));
});
