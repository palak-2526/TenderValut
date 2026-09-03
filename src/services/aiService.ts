import { Tender, VendorCompanyProfile, EligibilityPrediction, DeadlineAlert, Bid, AITenderEvaluationReport } from '../types';
import { checkCompanyEligibility, evaluateTenderWithBenefitsAlgorithmic } from '../utils/scoring';

export async function evaluateTenderWithAIEngine(
  tender: Tender,
  bids: Bid[],
  weights?: { technical: number; financial: number; benefits: number }
): Promise<AITenderEvaluationReport> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return evaluateTenderWithBenefitsAlgorithmic(tender, bids, weights);
  }

  try {
    const res = await fetch('/api/ai/evaluate-tender-bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tender, bids, weights }),
    });

    if (!res.ok) {
      throw new Error(`Evaluation API returned ${res.status}`);
    }

    const data = await res.json();
    return {
      tenderId: tender.id,
      evaluatedAt: new Date().toISOString(),
      source: data.source || 'gemini',
      executiveSummary: data.executiveSummary || 'AI Committee evaluation completed against all criteria and benefits.',
      targetBenefitsAssessed: data.targetBenefitsAssessed || [
        'Economic & Capital Budget Optimization (Cost Benefit)',
        'Technical Engineering & Architecture Durability (Quality Benefit)',
        'Turnkey Project Delivery Timeline & Velocity (Schedule Benefit)',
        'Environmental Sustainability & Energy Standards (ESG Benefit)',
        'Long-Term Warranty & Service Level Agreements (Lifecycle Benefit)',
      ],
      rankings: data.rankings || [],
      recommendedWinner: data.recommendedWinner,
    };
  } catch (err) {
    console.warn('AI Tender Evaluation API unreachable, using client algorithmic evaluator:', err);
    return evaluateTenderWithBenefitsAlgorithmic(tender, bids, weights);
  }
}

export async function predictTenderEligibility(
  companyProfile: VendorCompanyProfile,
  tender: Tender
): Promise<EligibilityPrediction> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return runClientFallbackEligibility(companyProfile, tender);
  }

  try {
    const res = await fetch('/api/ai/predict-eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyProfile, tender }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      eligibilityScore: data.eligibilityScore ?? 75,
      status: data.status || 'Moderate Eligibility',
      executiveSummary: data.executiveSummary || 'Automated assessment generated from company credentials.',
      metCriteria: data.metCriteria || [],
      unmetCriteria: data.unmetCriteria || [],
      gapAnalysis: data.gapAnalysis || 'Compliance evaluation completed against tender guidelines.',
      recommendations: data.recommendations || ['Review all mandatory document attachments prior to sealing bid.'],
      source: data.source || 'ai',
    };
  } catch (err) {
    console.warn('AI Server API unreachable, falling back to local algorithmic predictor:', err);
    return runClientFallbackEligibility(companyProfile, tender);
  }
}

export async function fetchDeadlineAlerts(
  tenders: Tender[],
  vendorProfile?: VendorCompanyProfile
): Promise<{ summary: string; alerts: DeadlineAlert[] }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return runClientFallbackAlerts(tenders);
  }

  try {
    const res = await fetch('/api/ai/deadline-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenders, vendorProfile }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      summary: data.summary || 'Proactive monitoring of critical tender submission and evaluation milestones.',
      alerts: data.alerts || [],
    };
  } catch (err) {
    console.warn('Deadline alerts API unreachable, using local heuristic:', err);
    return runClientFallbackAlerts(tenders);
  }
}

function runClientFallbackEligibility(
  companyProfile: VendorCompanyProfile,
  tender: Tender
): EligibilityPrediction {
  const result = checkCompanyEligibility(companyProfile, tender);
  let status: EligibilityPrediction['status'] = 'Moderate Eligibility';
  if (result.estimatedScore >= 75) status = 'High Eligibility';
  else if (result.estimatedScore < 50) status = 'Low Eligibility';

  return {
    eligibilityScore: result.estimatedScore,
    status,
    executiveSummary: `Algorithmic audit indicates ${status} (${result.estimatedScore}%) based on financial standing (₹${companyProfile.annualTurnover.toLocaleString('en-IN')}), operating history (${companyProfile.yearsInBusiness} yrs), and ISO credentials.`,
    metCriteria: result.metList,
    unmetCriteria: result.unmetList,
    gapAnalysis: result.unmetList.length > 0
      ? `Identified ${result.unmetList.length} compliance shortfall(s) relative to tender specifications.`
      : 'All primary eligibility benchmarks satisfied with zero compliance disqualifiers.',
    recommendations: result.unmetList.length > 0
      ? [
          'Form a consortium or sub-contracting arrangement if turnover is below the minimum threshold.',
          'Request formal waiver or submit equivalent international credential for missing certifications.',
          'Attach 3 years of audited balance sheets and CPA endorsement letter.',
        ]
      : [
          'Ensure encrypted PDF packages are digitally signed prior to the cutoff deadline.',
          'Verify Earnest Money Deposit (EMD) bank guarantee reference matches tender title.',
        ],
    source: 'local-heuristic',
  };
}

function runClientFallbackAlerts(tenders: Tender[]): { summary: string; alerts: DeadlineAlert[] } {
  const alerts: DeadlineAlert[] = [];
  const now = new Date().getTime();

  tenders.forEach((t) => {
    const deadline = new Date(t.deadline).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (t.status === 'open') {
      if (diffHours <= 0) {
        alerts.push({
          tenderId: t.id,
          tenderTitle: t.title,
          severity: 'CRITICAL',
          title: 'Deadline Reached: Locking Submissions',
          message: `The official bidding window for ${t.referenceNo} has concluded. Submissions must transition to evaluation.`,
          daysRemaining: 0,
          suggestedAction: 'Close submission portal and notify evaluation committee.',
        });
      } else if (diffHours <= 48) {
        alerts.push({
          tenderId: t.id,
          tenderTitle: t.title,
          severity: 'CRITICAL',
          title: 'Urgent: Under 48 Hours Remaining',
          message: `Only ${Math.round(diffHours)} hours remaining before submission portal seals permanently for ${t.referenceNo}.`,
          daysRemaining: Math.max(0, diffDays),
          suggestedAction: 'Upload all mandatory PDFs and generate encrypted SHA-256 seal immediately.',
        });
      } else if (diffDays <= 7) {
        alerts.push({
          tenderId: t.id,
          tenderTitle: t.title,
          severity: 'WARNING',
          title: 'Approaching Submission Deadline',
          message: `${diffDays} days remaining to prepare technical & financial proposals.`,
          daysRemaining: diffDays,
          suggestedAction: 'Run AI Eligibility Prediction and verify compliance with criteria.',
        });
      }
    }
  });

  return {
    summary: `Identified ${alerts.length} actionable deadline notifications and compliance milestone flags.`,
    alerts,
  };
}
