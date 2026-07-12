/**
 * Merge mechanical QA + fact-check into a single per-record unified report.
 */

type MechRecord = {
  record_id: string;
  record_type: string;
  status: string;
  reasons: string[];
  requires_human_review: boolean;
};

type FactResult = {
  orgName: string;
  field: string;
  claim: string;
  verdict: string;
  confidence: number;
  evidence?: { url: string; note: string }[];
  explanation?: string;
};

export function buildUnifiedReport(
  mechReport: {
    file: string;
    generated_at: string;
    batch_warning: string | null;
    summary: { total: number; pass: number; flagged: number; fail: number };
    records: MechRecord[];
  },
  factReport?: {
    confidence_threshold: number;
    summary: { total_claims_checked: number; ai_verified: number; requires_human_review: number };
    results: FactResult[];
  },
  confidenceThreshold = 0.75
) {
  const claimsByRecord = new Map<string, FactResult[]>();
  for (const r of factReport?.results || []) {
    const list = claimsByRecord.get(r.orgName) || [];
    list.push(r);
    claimsByRecord.set(r.orgName, list);
  }

  const records = mechReport.records.map((rec) => {
    const claims = claimsByRecord.get(rec.record_id) || [];
    const aiVerified = claims.filter(
      (c) => c.verdict === "supported" && c.confidence >= confidenceThreshold
    );
    const claimsNeedReview = claims.filter(
      (c) => c.verdict !== "supported" || c.confidence < confidenceThreshold
    );

    let finalStatus = rec.status;
    if (rec.status === "PASS" && claimsNeedReview.length > 0) {
      finalStatus = "FLAGGED";
    }
    if (claims.some((c) => c.verdict === "contradicted")) {
      finalStatus = "FAIL";
    }

    return {
      record_id: rec.record_id,
      record_type: rec.record_type,
      mechanical_status: rec.status,
      final_status: finalStatus,
      mechanical_reasons: rec.reasons,
      fact_check: {
        claims_checked: claims.length,
        ai_verified: aiVerified.length,
        requires_human_review: claimsNeedReview.length,
        claims: claims.map((c) => ({
          field: c.field,
          claim: c.claim,
          verdict: c.verdict,
          confidence: c.confidence,
          evidence: c.evidence || [],
          explanation: c.explanation || "",
        })),
      },
      requires_human_review:
        rec.requires_human_review || claimsNeedReview.length > 0,
      ready_for_submission: finalStatus !== "FAIL",
    };
  });

  const summary = {
    total: records.length,
    pass: records.filter((r) => r.final_status === "PASS").length,
    flagged: records.filter((r) => r.final_status === "FLAGGED").length,
    fail: records.filter((r) => r.final_status === "FAIL").length,
    ready_for_submission: records.filter((r) => r.ready_for_submission).length,
    claims_ai_verified: factReport?.summary.ai_verified || 0,
    claims_need_review: factReport?.summary.requires_human_review || 0,
  };

  return {
    file: mechReport.file,
    generated_at: new Date().toISOString(),
    pipeline: "moncho-qa-v3",
    batch_warning: mechReport.batch_warning,
    summary,
    records,
  };
}
