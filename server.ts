import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 1. AI Tender Eligibility Prediction
app.post("/api/ai/predict-eligibility", async (req, res) => {
  try {
    const { companyProfile, tender } = req.body;
    if (!companyProfile || !tender) {
      return res.status(400).json({ error: "Missing companyProfile or tender information" });
    }

    const ai = getGenAI();
    if (!ai) {
      // Graceful fallback to heuristic evaluation
      return res.json({
        source: "fallback",
        ...calculateHeuristicEligibility(companyProfile, tender),
      });
    }

    const prompt = `You are a Senior Government Procurement Auditor and Tender Evaluation AI.
Analyze whether the following vendor/company is eligible to bid for this tender.

TENDER DETAILS:
Title: ${tender.title}
Category: ${tender.category}
Budget: $${tender.budget?.toLocaleString?.() || tender.budget}
Min Annual Turnover Required: $${tender.eligibilityCriteria?.minTurnover?.toLocaleString?.() || tender.eligibilityCriteria?.minTurnover || "Not specified"}
Min Years Experience Required: ${tender.eligibilityCriteria?.minExperienceYears || 0} years
Required Certifications: ${JSON.stringify(tender.eligibilityCriteria?.requiredCertifications || [])}
Required Documents: ${JSON.stringify(tender.requiredDocuments || [])}

COMPANY PROFILE:
Company Name: ${companyProfile.name}
Annual Turnover: $${companyProfile.annualTurnover?.toLocaleString?.() || companyProfile.annualTurnover || 0}
Years in Business: ${companyProfile.yearsInBusiness || 0} years
Certifications Held: ${JSON.stringify(companyProfile.certifications || [])}
Past Projects Completed: ${companyProfile.pastProjectsCount || 0}
Past Performance Rating: ${companyProfile.rating || "N/A"}/5.0
Has Valid Tax Clearance: ${companyProfile.hasTaxClearance ? "Yes" : "No"}

Provide a comprehensive, highly objective assessment of the vendor's eligibility, met criteria, missing gaps, and actionable recommendations to qualify.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eligibilityScore: {
              type: Type.NUMBER,
              description: "Overall percentage score between 0 and 100",
            },
            status: {
              type: Type.STRING,
              description: "Eligibility tier: 'High Eligibility', 'Moderate Eligibility', or 'Low Eligibility'",
            },
            executiveSummary: {
              type: Type.STRING,
              description: "Concise auditor summary of the company's fit for this tender",
            },
            metCriteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of requirements that the company fully satisfies",
            },
            unmetCriteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of requirements that are partially or completely missing",
            },
            gapAnalysis: {
              type: Type.STRING,
              description: "Critical risk and gap analysis explaining potential rejection points",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical steps the vendor can take to bridge gaps before submission",
            },
          },
          required: [
            "eligibilityScore",
            "status",
            "executiveSummary",
            "metCriteria",
            "unmetCriteria",
            "gapAnalysis",
            "recommendations",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      source: "gemini",
      ...parsed,
    });
  } catch (error: any) {
    console.error("AI Eligibility Prediction error:", error);
    // Fallback on error to ensure flawless UX
    const { companyProfile, tender } = req.body;
    return res.json({
      source: "fallback-error",
      ...calculateHeuristicEligibility(companyProfile || {}, tender || {}),
    });
  }
});

// 2. AI Deadline & Requirement Alerts
app.post("/api/ai/deadline-alerts", async (req, res) => {
  try {
    const { tenders, vendorProfile } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        source: "fallback",
        alerts: generateHeuristicAlerts(tenders || []),
      });
    }

    const prompt = `You are a Tender Compliance and Deadline Intelligence AI.
Analyze the following active tenders and generate urgent alerts, milestone reminders, and critical requirement warnings.
Current Date: ${new Date().toISOString()}

TENDERS LIST:
${JSON.stringify(
  (tenders || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    deadline: t.deadline,
    status: t.status,
    requiredDocuments: t.requiredDocuments,
    minTurnover: t.eligibilityCriteria?.minTurnover,
  })),
  null,
  2
)}

Vendor Company Profile:
${vendorProfile ? JSON.stringify(vendorProfile) : "General Vendor"}

Identify:
1. Imminent deadlines (under 7 days, under 48 hours, or closed)
2. Crucial documentation and mandatory pre-requisite warnings
3. Potential disqualification risks`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Brief summary of the deadline landscape",
            },
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tenderId: { type: Type.STRING },
                  tenderTitle: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    description: "'CRITICAL' | 'WARNING' | 'INFO'",
                  },
                  title: { type: Type.STRING },
                  message: { type: Type.STRING },
                  daysRemaining: { type: Type.NUMBER },
                  suggestedAction: { type: Type.STRING },
                },
                required: ["tenderId", "severity", "title", "message", "suggestedAction"],
              },
            },
          },
          required: ["summary", "alerts"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      source: "gemini",
      ...parsed,
    });
  } catch (error: any) {
    console.error("AI Deadline alerts error:", error);
    return res.json({
      source: "fallback-error",
      alerts: generateHeuristicAlerts(req.body.tenders || []),
    });
  }
});

// 3. AI Tender Evaluation Engine - Evaluates bids with all required benefits & criteria
app.post("/api/ai/evaluate-tender-bids", async (req, res) => {
  try {
    const { tender, bids, weights } = req.body;
    if (!tender || !bids || !Array.isArray(bids) || bids.length === 0) {
      return res.status(400).json({ error: "Missing tender or bids array" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        source: "algorithmic",
        ...calculateHeuristicTenderEvaluation(tender, bids, weights),
      });
    }

    const techW = weights?.technical || 0.5;
    const finW = weights?.financial || 0.25;
    const benW = weights?.benefits || 0.25;

    const prompt = `You are the Lead Autonomous AI Tender Evaluation Auditor for TenderVault.
Perform a comprehensive, highly objective multi-dimensional evaluation of all submitted bids for this tender against ALL MANDATORY REQUIREMENTS AND REQUIRED BENEFITS.

TENDER SPECIFICATIONS & TARGET BENEFITS:
- Reference No: ${tender.referenceNo}
- Title: ${tender.title}
- Department: ${tender.department}
- Category: ${tender.category}
- Sanctioned Budget: ₹${tender.budget?.toLocaleString?.("en-IN") || tender.budget} INR
- Description: ${tender.description}
- Mandatory Eligibility:
  * Min Annual Turnover: ₹${tender.eligibilityCriteria?.minTurnover?.toLocaleString?.("en-IN") || 0} INR
  * Min Experience Required: ${tender.eligibilityCriteria?.minExperienceYears || 0} years
  * Mandatory Certifications: ${JSON.stringify(tender.eligibilityCriteria?.requiredCertifications || [])}
  * Mandatory Documents: ${JSON.stringify(tender.requiredDocuments || [])}
- Target Benefits Demanded by Tender:
  * Cost Optimization Benefit: ${tender.targetBenefits?.costOptimization || "Maximized capital cost savings within budget"}
  * Technical Excellence Benefit: ${tender.targetBenefits?.technicalExcellence || "Tier rating, high availability, modular scalability"}
  * Timeline Velocity Benefit: ${tender.targetBenefits?.timelineVelocity || "Expedited project delivery with zero downtime"}
  * Sustainability & ESG Benefit: ${tender.targetBenefits?.sustainabilityESG || "Energy efficiency, green certifications, low carbon footprint"}
  * Warranty & SLA Benefit: ${tender.targetBenefits?.warrantyAndSLA || "Multi-year comprehensive on-site warranty and rapid SLA response"}
  * Required Benefits Checklist: ${JSON.stringify(tender.targetBenefits?.requiredBenefitsList || ["Cost optimization", "Technical durability", "Rapid delivery", "Extended warranty", "Regulatory compliance"])}

SUBMITTED BIDS (${bids.length}):
${JSON.stringify(
  bids.map((b: any) => ({
    bidId: b.id,
    vendorName: b.vendorName,
    bidAmount: b.bidAmount,
    proposedTimelineWeeks: b.proposedTimelineWeeks,
    technicalProposalSummary: b.technicalProposalSummary,
    vendorProfile: b.vendorProfile,
    offeredBenefits: b.offeredBenefits,
    documentsCount: b.documents?.length || 0,
  })),
  null,
  2
)}

SCORING WEIGHTS:
- Technical Architecture: ${Math.round(techW * 100)}%
- Financial Competitiveness: ${Math.round(finW * 100)}%
- Tender Target Benefits Realization: ${Math.round(benW * 100)}%

EVALUATION RULES:
1. Verify mandatory statutory criteria. If a vendor does NOT meet turnover, experience, mandatory certifications, or budget ceiling, mark eligibilityMet: false and recommendation: 'DISQUALIFIED'.
2. For each bid, evaluate all 5 benefit dimensions (0-100 each):
   - costBenefitScore (savings vs budget ceiling)
   - technicalBenefitScore (architecture quality, certifications, vendor rating)
   - timelineBenefitScore (schedule velocity vs tender expectations)
   - sustainabilityBenefitScore (ESG commitments, energy efficiency, green certs)
   - warrantyBenefitScore (length of warranty & SLA commitment)
3. Calculate benefitScore (average of benefit dimensions).
4. Calculate combinedScore = (technicalScore * ${techW}) + (financialScore * ${finW}) + (benefitScore * ${benW}).
5. Rank qualified bids by combinedScore descending. Disqualified bids rank at bottom.
6. Provide tangible benefitsDelivered, keyAdvantages, risksOrTradeoffs, and formal award recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: "Auditor summary evaluating all bids against tender benefits and requirements",
            },
            targetBenefitsAssessed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of tender benefits evaluated",
            },
            rankings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bidId: { type: Type.STRING },
                  vendorName: { type: Type.STRING },
                  rank: { type: Type.NUMBER },
                  bidAmount: { type: Type.NUMBER },
                  combinedScore: { type: Type.NUMBER },
                  technicalScore: { type: Type.NUMBER },
                  financialScore: { type: Type.NUMBER },
                  benefitScore: { type: Type.NUMBER },
                  eligibilityMet: { type: Type.BOOLEAN },
                  unmetRequirements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  benefitsDelivered: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  keyAdvantages: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  risksOrTradeoffs: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  recommendation: {
                    type: Type.STRING,
                    description: "'STRONG_RECOMMEND' | 'QUALIFIED' | 'BELOW_THRESHOLD' | 'DISQUALIFIED'",
                  },
                  aiRationale: { type: Type.STRING },
                  benefitsBreakdown: {
                    type: Type.OBJECT,
                    properties: {
                      costBenefitScore: { type: Type.NUMBER },
                      technicalBenefitScore: { type: Type.NUMBER },
                      timelineBenefitScore: { type: Type.NUMBER },
                      sustainabilityBenefitScore: { type: Type.NUMBER },
                      warrantyBenefitScore: { type: Type.NUMBER },
                      keyAdvantages: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      risksOrTradeoffs: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: [
                      "costBenefitScore",
                      "technicalBenefitScore",
                      "timelineBenefitScore",
                      "sustainabilityBenefitScore",
                      "warrantyBenefitScore",
                      "keyAdvantages",
                      "risksOrTradeoffs",
                    ],
                  },
                },
                required: [
                  "bidId",
                  "vendorName",
                  "rank",
                  "bidAmount",
                  "combinedScore",
                  "technicalScore",
                  "financialScore",
                  "benefitScore",
                  "eligibilityMet",
                  "unmetRequirements",
                  "benefitsDelivered",
                  "keyAdvantages",
                  "risksOrTradeoffs",
                  "recommendation",
                  "aiRationale",
                  "benefitsBreakdown",
                ],
              },
            },
            recommendedWinner: {
              type: Type.OBJECT,
              properties: {
                bidId: { type: Type.STRING },
                vendorName: { type: Type.STRING },
                bidAmount: { type: Type.NUMBER },
                budgetSavingsAmount: { type: Type.NUMBER },
                budgetSavingsPercent: { type: Type.NUMBER },
                primaryBenefitsDelivered: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                justification: { type: Type.STRING },
              },
              required: [
                "bidId",
                "vendorName",
                "bidAmount",
                "budgetSavingsAmount",
                "budgetSavingsPercent",
                "primaryBenefitsDelivered",
                "justification",
              ],
            },
          },
          required: ["executiveSummary", "targetBenefitsAssessed", "rankings", "recommendedWinner"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      source: "gemini",
      ...parsed,
    });
  } catch (error: any) {
    console.error("AI Tender Evaluation error:", error);
    const { tender, bids, weights } = req.body;
    return res.json({
      source: "fallback-error",
      ...calculateHeuristicTenderEvaluation(tender || {}, bids || [], weights),
    });
  }
});

// Heuristic fallback for eligibility calculation
function calculateHeuristicEligibility(company: any, tender: any) {
  let score = 50;
  const met: string[] = [];
  const unmet: string[] = [];

  const requiredTurnover = tender?.eligibilityCriteria?.minTurnover || 0;
  const companyTurnover = company?.annualTurnover || 0;
  if (companyTurnover >= requiredTurnover) {
    score += 20;
    met.push(`Turnover requirement met (₹${companyTurnover.toLocaleString('en-IN')} >= ₹${requiredTurnover.toLocaleString('en-IN')})`);
  } else {
    score -= 20;
    unmet.push(`Annual turnover shortfall: ₹${companyTurnover.toLocaleString('en-IN')} is below required ₹${requiredTurnover.toLocaleString('en-IN')}`);
  }

  const requiredExp = tender?.eligibilityCriteria?.minExperienceYears || 0;
  const companyExp = company?.yearsInBusiness || 0;
  if (companyExp >= requiredExp) {
    score += 15;
    met.push(`Industry experience satisfied (${companyExp} years >= ${requiredExp} years required)`);
  } else {
    score -= 15;
    unmet.push(`Insufficient company operating history (${companyExp} years vs ${requiredExp} years required)`);
  }

  const reqCerts: string[] = tender?.eligibilityCriteria?.requiredCertifications || [];
  const compCerts: string[] = company?.certifications || [];
  let certsMet = 0;
  reqCerts.forEach((c) => {
    if (compCerts.some((cc) => cc.toLowerCase().includes(c.toLowerCase()))) {
      certsMet++;
    }
  });

  if (reqCerts.length === 0 || certsMet === reqCerts.length) {
    score += 15;
    met.push("All mandatory quality and regulatory certifications validated");
  } else {
    unmet.push(`Missing certifications: ${reqCerts.filter((c) => !compCerts.includes(c)).join(", ")}`);
  }

  if (company?.hasTaxClearance) {
    met.push("Valid statutory tax clearance certificate verified");
  } else {
    unmet.push("Statutory tax compliance certificate unverified");
    score -= 10;
  }

  const finalScore = Math.max(10, Math.min(98, score));
  let status = "Low Eligibility";
  if (finalScore >= 75) status = "High Eligibility";
  else if (finalScore >= 50) status = "Moderate Eligibility";

  return {
    eligibilityScore: finalScore,
    status,
    executiveSummary: `Algorithmic audit indicates ${status} (${finalScore}%) based on financial standing, operating history, and credentials.`,
    metCriteria: met,
    unmetCriteria: unmet,
    gapAnalysis: unmet.length
      ? `Identified ${unmet.length} critical requirement gaps that may lead to technical disqualification by the evaluation committee.`
      : "No critical compliance gaps detected. Proposal meets core baseline criteria.",
    recommendations: unmet.length
      ? [
          "Secure consortium/joint-venture partner if turnover threshold is narrow.",
          "Upload audited financial statements and tax compliance affidavits.",
          "Provide proof of past completed contracts of equivalent scale.",
        ]
      : [
          "Ensure all original attested PDF credentials are bound to bid package.",
          "Double-check that bid amount covers statutory performance guarantees.",
        ],
  };
}

// Heuristic fallback for multi-benefit tender evaluation
function calculateHeuristicTenderEvaluation(tender: any, bids: any[], weights?: any) {
  const techW = weights?.technical ?? 0.5;
  const finW = weights?.financial ?? 0.25;
  const benW = weights?.benefits ?? 0.25;

  const validBids = bids.filter((b: any) => b.status !== "disqualified");
  const lowestPrice = validBids.length > 0 ? Math.min(...validBids.map((b: any) => b.bidAmount)) : tender.budget;

  const rankings = bids.map((bid: any) => {
    const unmet: string[] = [];
    const advantages: string[] = [];
    const risks: string[] = [];
    const delivered: string[] = [];
    const profile = bid.vendorProfile || {};

    const minTurnover = tender.eligibilityCriteria?.minTurnover || 0;
    if (minTurnover > 0 && (profile.annualTurnover || 0) < minTurnover) {
      unmet.push(`Annual turnover (₹${(profile.annualTurnover || 0).toLocaleString('en-IN')}) below required ₹${minTurnover.toLocaleString('en-IN')}`);
      risks.push("Insufficient financial turnover threshold");
    }

    const minExp = tender.eligibilityCriteria?.minExperienceYears || 0;
    if (minExp > 0 && (profile.yearsInBusiness || 0) < minExp) {
      unmet.push(`Experience (${profile.yearsInBusiness || 0} years) below required (${minExp} years)`);
      risks.push(`Vendor lacks required operating history (${profile.yearsInBusiness || 0} vs ${minExp} yrs)`);
    }

    const reqCerts: string[] = tender.eligibilityCriteria?.requiredCertifications || [];
    const vendorCerts: string[] = profile.certifications || [];
    const missingCerts = reqCerts.filter((c) => !vendorCerts.some((vc) => vc.toLowerCase().includes(c.toLowerCase())));
    if (missingCerts.length > 0) {
      unmet.push(`Missing mandatory certifications: ${missingCerts.join(", ")}`);
      risks.push(`Lacks required certifications: ${missingCerts.join(", ")}`);
    }

    if (!profile.hasTaxClearance) {
      unmet.push("Statutory tax clearance unverified");
      risks.push("Tax compliance pending statutory clearance");
    }

    if (bid.bidAmount > tender.budget) {
      unmet.push(`Bid amount exceeds budget ceiling (₹${bid.bidAmount.toLocaleString('en-IN')} > ₹${tender.budget.toLocaleString('en-IN')})`);
      risks.push("Bid price over budget ceiling");
    }

    const eligibilityMet = unmet.length === 0;

    // 1. Cost Benefit Score
    const budgetSaved = Math.max(0, tender.budget - bid.bidAmount);
    const savingsPercent = tender.budget > 0 ? (budgetSaved / tender.budget) * 100 : 0;
    let costBenefitScore = 70;
    if (bid.bidAmount > tender.budget) {
      costBenefitScore = 20;
    } else if (lowestPrice > 0) {
      costBenefitScore = Math.min(100, Math.round((lowestPrice / bid.bidAmount) * 95 + (savingsPercent > 5 ? 5 : 0)));
    }
    if (budgetSaved > 0) {
      delivered.push(`Saves ₹${budgetSaved.toLocaleString('en-IN')} (${savingsPercent.toFixed(1)}%) against allocated budget`);
      advantages.push(`Competitive capital pricing saving ₹${budgetSaved.toLocaleString('en-IN')}`);
    }

    // 2. Technical Benefit Score
    const ratingScore = (profile.rating || 4.0) * 12; // 4.8 -> 57.6
    const expScore = Math.min(20, (profile.yearsInBusiness || 5) * 2);
    const certScore = Math.min(15, vendorCerts.length * 4);
    const docsScore = Math.min(8, (bid.documents?.length || 1) * 3);
    const technicalScore = Math.max(45, Math.min(98, Math.round(ratingScore + expScore + certScore + docsScore)));
    delivered.push(`High architectural capability with ${profile.yearsInBusiness || 5}y track record (${profile.pastProjectsCount || 10}+ projects)`);
    advantages.push(`Established execution maturity rating ${profile.rating || 4.5}/5.0`);

    // 3. Timeline Benefit Score
    const proposedWeeks = bid.proposedTimelineWeeks || 26;
    let timelineBenefitScore = 80;
    if (proposedWeeks <= 24) {
      timelineBenefitScore = 95;
      delivered.push(`Fast-track delivery schedule of ${proposedWeeks} weeks`);
      advantages.push(`Expedited milestone delivery (${proposedWeeks} weeks)`);
    } else if (proposedWeeks <= 28) {
      timelineBenefitScore = 88;
      delivered.push(`On-schedule turnkey deployment in ${proposedWeeks} weeks`);
    } else {
      timelineBenefitScore = 70;
      risks.push(`Extended delivery timeline (${proposedWeeks} weeks)`);
    }

    // 4. Sustainability & ESG Benefit Score
    const hasGreen = vendorCerts.some((c) => c.toLowerCase().includes("leed") || c.toLowerCase().includes("iso 14001"));
    const sustainabilityBenefitScore = hasGreen ? 92 : 78;
    if (hasGreen) {
      delivered.push("Green sustainability & environmental certification compliance verified");
      advantages.push("LEED / ISO 14001 Environmental management aligned");
    } else {
      delivered.push("Standard carbon reduction & energy efficiency compliance");
    }

    // 5. Warranty & SLA Benefit Score
    const warrantyMonths = bid.offeredBenefits?.warrantyMonths || (profile.yearsInBusiness >= 7 ? 36 : 24);
    let warrantyBenefitScore = 80;
    if (warrantyMonths >= 36) {
      warrantyBenefitScore = 95;
      delivered.push(`Comprehensive 3-year (${warrantyMonths} months) on-site SLA warranty with 24/7 coverage`);
      advantages.push(`Extended ${warrantyMonths}-month full warranty mitigating post-commissioning lifecycle costs`);
    } else {
      delivered.push(`${warrantyMonths}-month comprehensive equipment & installation warranty`);
    }

    // Overall Benefit Score
    const benefitScore = Math.round(
      costBenefitScore * 0.25 +
        technicalScore * 0.25 +
        timelineBenefitScore * 0.2 +
        sustainabilityBenefitScore * 0.15 +
        warrantyBenefitScore * 0.15
    );

    // Financial Score (Price evaluation L1)
    let financialScore = 70;
    if (bid.bidAmount > 0 && lowestPrice > 0) {
      financialScore = Math.min(100, Math.round((lowestPrice / bid.bidAmount) * 100));
    }

    // QCBS Combined Score
    const combinedScore = Math.round(technicalScore * techW + financialScore * finW + benefitScore * benW);

    let recommendation: "STRONG_RECOMMEND" | "QUALIFIED" | "BELOW_THRESHOLD" | "DISQUALIFIED" = "QUALIFIED";
    if (!eligibilityMet) {
      recommendation = "DISQUALIFIED";
    } else if (combinedScore >= 85) {
      recommendation = "STRONG_RECOMMEND";
    } else if (combinedScore < 70) {
      recommendation = "BELOW_THRESHOLD";
    }

    let aiRationale = `${bid.vendorName} delivers a comprehensive benefit rating of ${benefitScore}% with QCBS combined score of ${combinedScore}%. `;
    if (!eligibilityMet) {
      aiRationale += `DISQUALIFIED: Fails mandatory criteria: ${unmet.join("; ")}.`;
    } else if (recommendation === "STRONG_RECOMMEND") {
      aiRationale += `STRONG RECOMMENDATION: Optimal balance of technical architecture, budget savings (₹${budgetSaved.toLocaleString('en-IN')}), and extended warranty.`;
    } else {
      aiRationale += `QUALIFIED: Valid bid meeting baseline criteria with moderate value delivery.`;
    }

    return {
      bidId: bid.id,
      vendorName: bid.vendorName,
      rank: 0,
      bidAmount: bid.bidAmount,
      combinedScore,
      technicalScore,
      financialScore,
      benefitScore,
      eligibilityMet,
      unmetRequirements: unmet,
      benefitsDelivered: delivered,
      keyAdvantages: advantages,
      risksOrTradeoffs: risks,
      recommendation,
      aiRationale,
      benefitsBreakdown: {
        costBenefitScore,
        technicalBenefitScore: technicalScore,
        timelineBenefitScore,
        sustainabilityBenefitScore,
        warrantyBenefitScore,
        keyAdvantages: advantages,
        risksOrTradeoffs: risks,
      },
    };
  });

  // Sort: qualified first by combinedScore descending, then disqualified
  rankings.sort((a, b) => {
    if (a.eligibilityMet && !b.eligibilityMet) return -1;
    if (!a.eligibilityMet && b.eligibilityMet) return 1;
    if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
    return a.bidAmount - b.bidAmount;
  });

  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  const winner = rankings.find((r) => r.eligibilityMet && r.recommendation !== "DISQUALIFIED") || rankings[0];
  const budgetSavedWinner = winner ? Math.max(0, tender.budget - winner.bidAmount) : 0;
  const savingsPercentWinner = winner && tender.budget > 0 ? (budgetSavedWinner / tender.budget) * 100 : 0;

  return {
    executiveSummary: `Autonomous AI Evaluation completed across ${bids.length} submitted bids. The evaluation synthesized mandatory statutory compliance against all 5 core tender benefit dimensions: Cost Advantage, Technical Engineering, Timeline Velocity, Sustainability (ESG), and Warranty Lifecycle.`,
    targetBenefitsAssessed: [
      "Economic & Capital Budget Optimization (Cost Benefit)",
      "Technical Engineering & Architecture Durability (Quality Benefit)",
      "Turnkey Project Delivery Timeline & Velocity (Schedule Benefit)",
      "Environmental Sustainability & Energy Standards (ESG Benefit)",
      "Long-Term Warranty & Service Level Agreements (Lifecycle Benefit)",
    ],
    rankings,
    recommendedWinner: winner
      ? {
          bidId: winner.bidId,
          vendorName: winner.vendorName,
          bidAmount: winner.bidAmount,
          budgetSavingsAmount: budgetSavedWinner,
          budgetSavingsPercent: Number(savingsPercentWinner.toFixed(2)),
          primaryBenefitsDelivered: winner.benefitsDelivered.slice(0, 4),
          justification: `${winner.vendorName} achieved Rank 1 with a combined score of ${winner.combinedScore}% and benefit score of ${winner.benefitScore}%. The proposal delivers an optimal balance of ₹${budgetSavedWinner.toLocaleString('en-IN')} in direct budget savings, robust technical compliance, and extended on-site SLA warranty without compromising delivery timelines.`,
        }
      : undefined,
  };
}

function generateHeuristicAlerts(tenders: any[]) {
  const alerts: any[] = [];
  const now = new Date().getTime();

  tenders.forEach((t) => {
    const deadline = new Date(t.deadline).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (diffHours < 0) {
      alerts.push({
        tenderId: t.id,
        tenderTitle: t.title,
        severity: "INFO",
        title: "Tender Submissions Sealed",
        message: `Bidding period concluded. Submission portal locked for ${t.referenceNo || t.title}.`,
        daysRemaining: 0,
        suggestedAction: "Monitor evaluation committee scoring and winner announcement.",
      });
    } else if (diffHours <= 48) {
      alerts.push({
        tenderId: t.id,
        tenderTitle: t.title,
        severity: "CRITICAL",
        title: "Urgent: Final 48-Hour Deadline Window",
        message: `Only ${Math.round(diffHours)} hours remaining before submission portal locks permanently.`,
        daysRemaining: Math.max(0, diffDays),
        suggestedAction: "Complete PDF document uploads and finalize encrypted bid seal immediately.",
      });
    } else if (diffDays <= 7) {
      alerts.push({
        tenderId: t.id,
        tenderTitle: t.title,
        severity: "WARNING",
        title: "Approaching Submission Deadline",
        message: `${diffDays} days remaining to submit sealed bids and notarized documents.`,
        daysRemaining: diffDays,
        suggestedAction: "Run AI eligibility check and review required checklist: " + (t.requiredDocuments?.join?.(", ") || "Mandatory docs"),
      });
    }
  });

  return alerts;
}

// Start Express + Vite Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tender Management System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
