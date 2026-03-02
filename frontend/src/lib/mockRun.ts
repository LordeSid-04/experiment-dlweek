import type { GovernanceMode } from "@/lib/governance";

export type AgentRole =
  | "Architect"
  | "Developer"
  | "Verifier"
  | "Operator"
  | "Governor";

export type ArtifactType = "plan" | "diff" | "test" | "securityReport";
export type GateDecision = "ALLOWED" | "NEEDS_APPROVAL" | "BLOCKED";
export type FindingSeverity = "LOW" | "MED" | "HIGH" | "CRITICAL";

export interface RunTimelineStep {
  id: string;
  agentRole: AgentRole;
  artifactType: ArtifactType;
  riskScore: number;
  gateDecision: GateDecision;
  timestamp: string;
  linkedFindingIds?: string[];
}

export interface DiffFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  ruleName: string;
  lineNumber: number;
  evidence: string;
  suggestedFixSnippet: string;
}

export interface UnifiedDiffLine {
  lineNumber: number;
  kind: "context" | "add" | "remove";
  content: string;
  findingIds?: string[];
}

export interface MockRunResult {
  timeline: RunTimelineStep[];
  diffLines: UnifiedDiffLine[];
  findings: DiffFinding[];
}

function clampRisk(riskScore: number): number {
  return Math.max(0, Math.min(100, Math.round(riskScore)));
}

function getRiskLevel(riskScore: number): "low" | "medium" | "high" | "critical" {
  const score = clampRisk(riskScore);
  if (score <= 35) return "low";
  if (score <= 70) return "medium";
  if (score <= 90) return "high";
  return "critical";
}

function gateByMode(mode: GovernanceMode, riskScore: number): GateDecision {
  const level = getRiskLevel(riskScore);

  if (mode === "assist") {
    return "NEEDS_APPROVAL";
  }

  if (mode === "pair") {
    if (level === "low") return "ALLOWED";
    if (level === "medium") return "NEEDS_APPROVAL";
    return "BLOCKED";
  }

  if (level === "critical") return "BLOCKED";
  if (level === "high") return "NEEDS_APPROVAL";
  return "ALLOWED";
}

function buildFindings(baseRisk: number): DiffFinding[] {
  const findings: DiffFinding[] = [
    {
      id: "finding-auth-bypass",
      severity: baseRisk > 75 ? "HIGH" : "MED",
      title: "Auth middleware bypass risk",
      ruleName: "SEC-AUTH-002",
      lineNumber: 24,
      evidence: "Route handler changed without auth guard in request pipeline.",
      suggestedFixSnippet:
        "if (!session?.user) {\n  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n}",
    },
    {
      id: "finding-unsafe-log",
      severity: baseRisk > 88 ? "CRITICAL" : "HIGH",
      title: "Sensitive token potentially logged",
      ruleName: "SEC-LOG-004",
      lineNumber: 37,
      evidence: "Header value appears in debug log output.",
      suggestedFixSnippet:
        "const safeHeaders = { ...headers, authorization: '[REDACTED]' };\nlogger.info('request headers', safeHeaders);",
    },
    {
      id: "finding-missing-where",
      severity: baseRisk > 60 ? "HIGH" : "MED",
      title: "Mutation scope may be too broad",
      ruleName: "DATA-GUARD-009",
      lineNumber: 52,
      evidence: "Update operation does not include a strict filter id.",
      suggestedFixSnippet:
        "await db.user.update({ where: { id: userId }, data: payload });",
    },
  ];

  return findings;
}

function buildUnifiedDiff(findings: DiffFinding[]): UnifiedDiffLine[] {
  const lines: UnifiedDiffLine[] = [
    { lineNumber: 20, kind: "context", content: "export async function POST(req: Request) {" },
    { lineNumber: 21, kind: "context", content: "  const body = await req.json();" },
    {
      lineNumber: 24,
      kind: "add",
      content: "  // TODO: auth check temporarily skipped",
      findingIds: ["finding-auth-bypass"],
    },
    { lineNumber: 25, kind: "add", content: "  const result = await saveWorkspace(body);" },
    { lineNumber: 34, kind: "context", content: "  const headers = Object.fromEntries(req.headers);" },
    {
      lineNumber: 37,
      kind: "add",
      content: "  logger.debug('incoming headers', headers);",
      findingIds: ["finding-unsafe-log"],
    },
    { lineNumber: 48, kind: "context", content: "  // update user workspace state" },
    {
      lineNumber: 52,
      kind: "add",
      content: "  await db.user.updateMany({ data: { workspace: result.id } });",
      findingIds: ["finding-missing-where"],
    },
    { lineNumber: 55, kind: "context", content: "  return NextResponse.json({ ok: true });" },
    { lineNumber: 56, kind: "context", content: "}" },
  ];

  return lines.map((line) => ({
    ...line,
    findingIds: line.findingIds?.filter((id) =>
      findings.some((finding) => finding.id === id)
    ),
  }));
}

function deriveRiskFromTask(taskInput: string): number {
  const normalized = taskInput.trim().toLowerCase();
  if (!normalized) return 45;

  let score = 30;
  if (normalized.includes("deploy") || normalized.includes("production")) score += 28;
  if (normalized.includes("auth") || normalized.includes("permission")) score += 24;
  if (normalized.includes("delete") || normalized.includes("migration")) score += 22;
  if (normalized.includes("ui") || normalized.includes("copy")) score -= 8;
  if (normalized.includes("test")) score -= 6;

  return clampRisk(score);
}

export function generateMockRun(
  taskInput: string,
  mode: GovernanceMode
): MockRunResult {
  const baseRisk = deriveRiskFromTask(taskInput);
  const now = Date.now();

  const diffRisk = clampRisk(baseRisk + 8);
  const securityRisk = clampRisk(baseRisk + 12);
  const gateRisk = clampRisk(baseRisk + 10);
  const findings = buildFindings(baseRisk);
  const diffLines = buildUnifiedDiff(findings);
  const findingIds = findings.map((finding) => finding.id);

  return {
    diffLines,
    findings,
    timeline: [
      {
        id: "step-plan",
        agentRole: "Architect",
        artifactType: "plan",
        riskScore: clampRisk(baseRisk - 6),
        gateDecision: "ALLOWED",
        timestamp: new Date(now).toISOString(),
      },
      {
        id: "step-diff",
        agentRole: "Developer",
        artifactType: "diff",
        riskScore: diffRisk,
        gateDecision: gateByMode(mode, diffRisk),
        timestamp: new Date(now + 1200).toISOString(),
        linkedFindingIds: findingIds,
      },
      {
        id: "step-security",
        agentRole: "Verifier",
        artifactType: "securityReport",
        riskScore: securityRisk,
        gateDecision: gateByMode(mode, securityRisk),
        timestamp: new Date(now + 2400).toISOString(),
        linkedFindingIds: findingIds,
      },
      {
        id: "step-gate",
        agentRole: "Governor",
        artifactType: "test",
        riskScore: gateRisk,
        gateDecision: gateByMode(mode, gateRisk),
        timestamp: new Date(now + 3600).toISOString(),
      },
    ],
  };
}
