const { sha256 } = require("./hashing");

class ModelProviderError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "ModelProviderError";
    this.code = code;
    this.status = status;
  }
}

function extractFencedJson(text) {
  const fencedMatch = String(text || "").match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch?.[1]?.trim() || "";
}

function extractBalancedJson(text) {
  const value = String(text || "");
  const openers = ["{", "["];
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (!openers.includes(char)) continue;
    const stack = [char];
    let inString = false;
    let escaped = false;
    for (let cursor = index + 1; cursor < value.length; cursor += 1) {
      const current = value[cursor];
      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === "\\") {
          escaped = true;
          continue;
        }
        if (current === "\"") {
          inString = false;
        }
        continue;
      }
      if (current === "\"") {
        inString = true;
        continue;
      }
      if (current === "{" || current === "[") {
        stack.push(current);
        continue;
      }
      if (current === "}" || current === "]") {
        const last = stack[stack.length - 1];
        const pairMatches =
          (last === "{" && current === "}") || (last === "[" && current === "]");
        if (!pairMatches) {
          break;
        }
        stack.pop();
        if (!stack.length) {
          return value.slice(index, cursor + 1);
        }
      }
    }
  }
  return "";
}

function tryParseJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseModelJson(text) {
  const direct = tryParseJson(text);
  if (direct) return direct;

  const fenced = extractFencedJson(text);
  const fencedParsed = tryParseJson(fenced);
  if (fencedParsed) return fencedParsed;

  const balanced = extractBalancedJson(text);
  return tryParseJson(balanced);
}

function toPartText(part) {
  if (!part || typeof part !== "object") return "";
  if (typeof part.text === "string") return part.text;
  if (part.text && typeof part.text === "object" && typeof part.text.value === "string") {
    return part.text.value;
  }
  if (typeof part.output_text === "string") return part.output_text;
  if (typeof part.value === "string") return part.value;
  return "";
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }
  const contentParts = [];
  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  outputs.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((part) => {
      const text = toPartText(part);
      if (text) contentParts.push(text);
    });
  });
  if (contentParts.length) return contentParts.join("\n").trim();
  return "";
}

function extractOutputParsed(payload) {
  if (payload?.output_parsed && typeof payload.output_parsed === "object") {
    return payload.output_parsed;
  }
  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.parsed && typeof part.parsed === "object") {
        return part.parsed;
      }
    }
  }
  return null;
}

function toResponseBody({ model, systemPrompt, userPrompt, responseSchema }) {
  const body = {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }],
      },
    ],
  };
  if (responseSchema?.schema && typeof responseSchema.schema === "object") {
    body.text = {
      format: {
        type: "json_schema",
        name: responseSchema.name || "agent_response",
        strict: true,
        schema: responseSchema.schema,
      },
    };
  }
  return body;
}

function resolveCodexModelCandidates() {
  const ordered = [
    process.env.OPENAI_CODEX_MODEL,
    process.env.OPENAI_MODEL,
    process.env.OPENAI_AUTOPILOT_FALLBACK_MODEL,
    process.env.OPENAI_PAIR_MODEL,
    process.env.OPENAI_FAST_MODEL,
    "gpt-4.1-mini",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return Array.from(new Set(ordered));
}

function resolveCodexModel() {
  return resolveCodexModelCandidates()[0];
}

function resolveOpenAiErrorCode(status) {
  if (status === 401) return "INVALID_API_KEY";
  if (status === 403) return "MODEL_NOT_PERMITTED";
  if (status === 404) return "MODEL_NOT_FOUND";
  if (status === 408) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "MODEL_UNAVAILABLE";
  return "MODEL_ERROR";
}

function parseRetryAfterMs(response) {
  const header = response.headers.get("retry-after");
  if (!header) return 0;
  const asNumber = Number(header);
  if (Number.isFinite(asNumber)) return Math.max(0, asNumber * 1000);
  const retryDate = Date.parse(header);
  if (!Number.isFinite(retryDate)) return 0;
  return Math.max(0, retryDate - Date.now());
}

async function callCodex({ agentRole, systemPrompt, userPrompt, responseSchema }) {
  const now = new Date().toISOString();
  const models = resolveCodexModelCandidates();
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new ModelProviderError(
      "INVALID_API_KEY",
      "OPENAI_API_KEY is missing. Add a valid API key in backend environment.",
      401
    );
  }

  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 45000);
  const maxAttempts = 2;
  let lastError = null;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const model = models[modelIndex];
    let attempt = 0;
    let schemaEnabled = Boolean(responseSchema?.schema);

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        let response;
        try {
          response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            signal: controller.signal,
            body: JSON.stringify(
              toResponseBody({
                model,
                systemPrompt,
                userPrompt,
                responseSchema: schemaEnabled ? responseSchema : undefined,
              })
            ),
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          const code = resolveOpenAiErrorCode(response.status);
          const retryable = response.status === 429 || response.status >= 500;
          if (retryable && attempt < maxAttempts) {
            const waitMs = Math.max(250, parseRetryAfterMs(response));
            await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 2000)));
            continue;
          }
          if (response.status === 400 && schemaEnabled && responseSchema?.schema) {
            schemaEnabled = false;
            attempt = 0;
            continue;
          }

          const modelError = new ModelProviderError(
            code,
            `OpenAI responses API returned ${response.status} for model ${model}.`,
            response.status
          );
          lastError = modelError;
          const canTryNextModel =
            (response.status === 400 || response.status === 403 || response.status === 404) &&
            modelIndex < models.length - 1;
          if (canTryNextModel) {
            break;
          }
          throw modelError;
        }

        const payload = await response.json();
        const text = extractOutputText(payload);
        const parsed = extractOutputParsed(payload) || parseModelJson(text);

        return {
          text,
          parsed,
          proof: {
            provider: "openai-api",
            model,
            responseId: payload.id || `openai-${sha256(text).slice(0, 12)}`,
            timestamp: now,
            agentRole,
          },
        };
      } catch (error) {
        if (error instanceof ModelProviderError) {
          throw error;
        }
        const message = String(error?.message || "");
        const isAbort = error?.name === "AbortError" || /aborted|timeout/i.test(message);
        if (isAbort) {
          throw new ModelProviderError(
            "TIMEOUT",
            `OpenAI request timed out after ${timeoutMs}ms for model ${model}.`,
            408
          );
        }
        throw new ModelProviderError("MODEL_UNAVAILABLE", `OpenAI request failed: ${message}`, 503);
      }
    }
  }

  if (lastError) {
    throw new ModelProviderError(
      lastError.code,
      `${lastError.message} Attempted models: ${models.join(", ")}.`,
      lastError.status
    );
  }
  throw new ModelProviderError("MODEL_UNAVAILABLE", "OpenAI request could not be completed.", 503);
}

module.exports = {
  callCodex,
  ModelProviderError,
  __test: {
    extractBalancedJson,
    parseModelJson,
    extractOutputText,
    extractOutputParsed,
    resolveCodexModel,
    resolveCodexModelCandidates,
    resolveOpenAiErrorCode,
  },
};
