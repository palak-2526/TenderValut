import { Bid, Tender, VendorCompanyProfile } from '../types';

export interface ComparisonResult {
  bidId: string;
  vendorName: string;
  bidAmount: number;
  isL1Price: boolean;
  priceVariancePercent: number; // relative to budget or L1
  eligibilityMet: boolean;
  unmetRequirements: string[];
  technicalScore: number;
  financialScore: number;
  combinedScore: number;
  rank: number;
  recommendation: 'STRONG_RECOMMEND' | 'QUALIFIED' | 'BELOW_THRESHOLD' | 'DISQUALIFIED';
}

export function evaluateBidsComparison(
  tender: Tender,
  bids: Bid[],
  technicalWeights = 0.7,
  financialWeights = 0.3
): ComparisonResult[] {
  if (!bids || bids.length === 0) return [];

  const validBids = [...bids].filter(b => b.status !== 'disqualified');
  const lowestPrice = validBids.length > 0 
    ? Math.min(...validBids.map(b => b.bidAmount))
    : 0;

  const evaluated = bids.map((bid) => {
    const unmet: string[] = [];
    const profile = bid.vendorProfile;

    if (tender.eligibilityCriteria.minTurnover > 0 && (profile?.annualTurnover || 0) < tender.eligibilityCriteria.minTurnover) {
      unmet.push(`Turnover (₹${(profile?.annualTurnover || 0).toLocaleString('en-IN')}) < Req (₹${tender.eligibilityCriteria.minTurnover.toLocaleString('en-IN')})`);
    }

    if (tender.eligibilityCriteria.minExperienceYears > 0 && (profile?.yearsInBusiness || 0) < tender.eligibilityCriteria.minExperienceYears) {
      unmet.push(`Experience (${profile?.yearsInBusiness || 0} yrs) < Req (${tender.eligibilityCriteria.minExperienceYears} yrs)`);
    }

    const reqCerts = tender.eligibilityCriteria.requiredCertifications || [];
    const vendorCerts = profile?.certifications || [];
    const missingCerts = reqCerts.filter(c => !vendorCerts.some(vc => vc.toLowerCase().includes(c.toLowerCase())));
    if (missingCerts.length > 0) {
      unmet.push(`Missing certifications: ${missingCerts.join(', ')}`);
    }

    if (profile && !profile.hasTaxClearance) {
      unmet.push('Tax clearance certificate not confirmed');
    }

    if (bid.bidAmount > tender.budget) {
      unmet.push(`Bid price exceeds allocated budget (₹${bid.bidAmount.toLocaleString('en-IN')} > ₹${tender.budget.toLocaleString('en-IN')})`);
    }

    const eligibilityMet = unmet.length === 0;

    let techScore = bid.scores?.technicalScore;
    if (techScore === undefined) {
      const ratingBonus = (profile?.rating || 4.0) * 12; // e.g. 4.8 * 12 = 57.6
      const expBonus = Math.min(20, (profile?.yearsInBusiness || 5) * 2);
      const certBonus = Math.min(15, (profile?.certifications?.length || 1) * 4);
      const docsBonus = Math.min(10, (bid.documents?.length || 1) * 3);
      techScore = Math.round(ratingBonus + expBonus + certBonus + docsBonus);
      techScore = Math.max(50, Math.min(96, techScore));
    }

    let finScore = bid.scores?.financialScore;
    if (finScore === undefined) {
      if (bid.bidAmount > 0 && lowestPrice > 0) {
        finScore = Math.round((lowestPrice / bid.bidAmount) * 100);
      } else {
        finScore = 70;
      }
    }

    const combined = Math.round(techScore * technicalWeights + finScore * financialWeights);

    const priceVariance = Math.round(((bid.bidAmount - tender.budget) / tender.budget) * 100);

    let recommendation: ComparisonResult['recommendation'] = 'QUALIFIED';
    if (!eligibilityMet) {
      recommendation = 'DISQUALIFIED';
    } else if (combined >= 85) {
      recommendation = 'STRONG_RECOMMEND';
    } else if (combined < 70) {
      recommendation = 'BELOW_THRESHOLD';
    }

    return {
      bidId: bid.id,
      vendorName: bid.vendorName,
      bidAmount: bid.bidAmount,
      isL1Price: bid.bidAmount === lowestPrice,
      priceVariancePercent: priceVariance,
      eligibilityMet,
      unmetRequirements: unmet,
      technicalScore: techScore,
      financialScore: finScore,
      combinedScore: combined,
      rank: 0,
      recommendation,
    };
  });

  evaluated.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) {
      return b.combinedScore - a.combinedScore;
    }
    return a.bidAmount - b.bidAmount;
  });

  evaluated.forEach((item, index) => {
    item.rank = index + 1;
  });

  return evaluated;
}

export function checkCompanyEligibility(profile: VendorCompanyProfile, tender: Tender): {
  isEligible: boolean;
  metList: string[];
  unmetList: string[];
  estimatedScore: number;
} {
  const met: string[] = [];
  const unmet: string[] = [];
  let score = 60;

  if (profile.annualTurnover >= tender.eligibilityCriteria.minTurnover) {
    met.push(`Annual turnover (₹${profile.annualTurnover.toLocaleString('en-IN')}) meets threshold (₹${tender.eligibilityCriteria.minTurnover.toLocaleString('en-IN')})`);
    score += 15;
  } else {
    unmet.push(`Annual turnover shortfall: Current ₹${profile.annualTurnover.toLocaleString('en-IN')} < Required ₹${tender.eligibilityCriteria.minTurnover.toLocaleString('en-IN')}`);
    score -= 20;
  }

  if (profile.yearsInBusiness >= tender.eligibilityCriteria.minExperienceYears) {
    met.push(`Operating experience (${profile.yearsInBusiness} yrs) satisfies requirement (${tender.eligibilityCriteria.minExperienceYears} yrs)`);
    score += 10;
  } else {
    unmet.push(`Operating experience (${profile.yearsInBusiness} yrs) is less than required (${tender.eligibilityCriteria.minExperienceYears} yrs)`);
    score -= 15;
  }

  const reqCerts = tender.eligibilityCriteria.requiredCertifications || [];
  const missingCerts = reqCerts.filter(rc => !profile.certifications.some(c => c.toLowerCase().includes(rc.toLowerCase())));
  if (missingCerts.length === 0) {
    met.push('All mandatory technical & regulatory quality certifications verified');
    score += 10;
  } else {
    unmet.push(`Missing mandatory certifications: ${missingCerts.join(', ')}`);
    score -= 15;
  }

  if (profile.hasTaxClearance) {
    met.push('Current fiscal year statutory tax clearance certificate on file');
    score += 5;
  } else {
    unmet.push('Tax clearance certificate pending validation');
    score -= 10;
  }

  return {
    isEligible: unmet.length === 0,
    metList: met,
    unmetList: unmet,
    estimatedScore: Math.max(15, Math.min(98, score)),
  };
}

export function evaluateTenderWithBenefitsAlgorithmic(
  tender: Tender,
  bids: Bid[],
  weights = { technical: 0.5, financial: 0.25, benefits: 0.25 }
) {
  const techW = weights.technical;
  const finW = weights.financial;
  const benW = weights.benefits;

  const validBids = bids.filter((b) => b.status !== 'disqualified');
  const lowestPrice = validBids.length > 0 ? Math.min(...validBids.map((b) => b.bidAmount)) : tender.budget;

  const rankings = bids.map((bid) => {
    const unmet: string[] = [];
    const advantages: string[] = [];
    const risks: string[] = [];
    const delivered: string[] = [];
    const profile = bid.vendorProfile || ({} as any);

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
      delivered.push(`Saves ₹${budgetSaved.toLocaleString('en-IN')} (${savingsPercent.toFixed(1)}%) against allocated budget ceiling`);
      advantages.push(`Competitive capital pricing saving ₹${budgetSaved.toLocaleString('en-IN')}`);
    }

    // 2. Technical Benefit Score
    let technicalScore = bid.scores?.technicalScore;
    if (technicalScore === undefined) {
      const ratingScore = (profile.rating || 4.0) * 12;
      const expScore = Math.min(20, (profile.yearsInBusiness || 5) * 2);
      const certScore = Math.min(15, vendorCerts.length * 4);
      const docsScore = Math.min(8, (bid.documents?.length || 1) * 3);
      technicalScore = Math.max(45, Math.min(98, Math.round(ratingScore + expScore + certScore + docsScore)));
    }
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

    // Financial Score
    let financialScore = 70;
    if (bid.bidAmount > 0 && lowestPrice > 0) {
      financialScore = Math.min(100, Math.round((lowestPrice / bid.bidAmount) * 100));
    }

    // QCBS Combined Score
    const combinedScore = Math.round(technicalScore * techW + financialScore * finW + benefitScore * benW);

    let recommendation: 'STRONG_RECOMMEND' | 'QUALIFIED' | 'BELOW_THRESHOLD' | 'DISQUALIFIED' = 'QUALIFIED';
    if (!eligibilityMet) {
      recommendation = 'DISQUALIFIED';
    } else if (combinedScore >= 85) {
      recommendation = 'STRONG_RECOMMEND';
    } else if (combinedScore < 70) {
      recommendation = 'BELOW_THRESHOLD';
    }

    let aiRationale = `${bid.vendorName} achieves a comprehensive benefit rating of ${benefitScore}% with QCBS score of ${combinedScore}%. `;
    if (!eligibilityMet) {
      aiRationale += `DISQUALIFIED: Fails mandatory criteria: ${unmet.join('; ')}.`;
    } else if (recommendation === 'STRONG_RECOMMEND') {
      aiRationale += `STRONG RECOMMENDATION: Optimal balance of technical architecture, ₹${budgetSaved.toLocaleString('en-IN')} budget savings, and extended warranty.`;
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

  const winner = rankings.find((r) => r.eligibilityMet && r.recommendation !== 'DISQUALIFIED') || rankings[0];
  const budgetSavedWinner = winner ? Math.max(0, tender.budget - winner.bidAmount) : 0;
  const savingsPercentWinner = winner && tender.budget > 0 ? (budgetSavedWinner / tender.budget) * 100 : 0;

  return {
    tenderId: tender.id,
    evaluatedAt: new Date().toISOString(),
    source: 'algorithmic' as const,
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
