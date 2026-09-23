export type Claim = { text: string; sourceIds: string[]; confidence: number };

export type PolicyInput = {
  body: string;
  readerGain: string;
  claims: Claim[];
  interpretationStatements: string[];
  suppliedSourceIds: string[];
  personalEvidence: string[];
};

export type PolicyResult = { passed: boolean; gate: string; reason?: string };

const prohibited = [
  'in today’s rapidly evolving world',
  'in todays rapidly evolving world',
  'the future is here',
  'revolutionary',
  'the best tool',
];

/** Deterministic gates run before any model score or publishing action. */
export function runHardPolicies(input: PolicyInput): PolicyResult[] {
  const normalized = input.body.toLowerCase();
  const results: PolicyResult[] = [
    { gate: 'reader_gain', passed: input.readerGain.trim().length >= 10, reason: 'Reader gain must be explicit.' },
    { gate: 'evidence_completeness', passed: input.claims.every((claim) => claim.sourceIds.length > 0), reason: 'Every factual claim needs a supplied source.' },
    { gate: 'source_membership', passed: input.claims.every((claim) => claim.sourceIds.every((id) => input.suppliedSourceIds.includes(id))), reason: 'Claims may only reference supplied sources.' },
    { gate: 'claim_confidence', passed: input.claims.every((claim) => claim.confidence >= 0.7), reason: 'Low-confidence claims must be revised or removed.' },
    { gate: 'invented_experience', passed: input.personalEvidence.length > 0 || input.interpretationStatements.every((statement) => !/\b(i|we)\s+(used|saw|tested|attended|achieved)\b/i.test(statement)), reason: 'Personal experience requires owner-supplied evidence.' },
    { gate: 'prohibited_language', passed: !prohibited.some((phrase) => normalized.includes(phrase)), reason: 'Generic or unsupported promotional language detected.' },
    { gate: 'length', passed: input.body.trim().length >= 50 && input.body.length <= 3000, reason: 'LinkedIn text must be between 50 and 3,000 characters.' },
  ];
  return results;
}

export function canPublish(results: PolicyResult[], finalScore: number, minimumScore = 85) {
  return results.every((result) => result.passed) && finalScore >= minimumScore;
}
