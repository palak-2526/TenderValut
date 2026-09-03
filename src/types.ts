export type Role = 'admin' | 'vendor' | 'evaluator';

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'draft';

export type BidStatus = 'submitted' | 'under_review' | 'shortlisted' | 'awarded' | 'disqualified' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string;
  avatarUrl?: string;
  companyProfile?: VendorCompanyProfile;
}

export interface VendorCompanyProfile {
  name: string;
  registrationNumber: string;
  annualTurnover: number;
  yearsInBusiness: number;
  certifications: string[];
  pastProjectsCount: number;
  rating: number; // out of 5
  hasTaxClearance: boolean;
  contactPerson: string;
  phone: string;
}

export interface TenderEligibilityCriteria {
  minTurnover: number;
  minExperienceYears: number;
  requiredCertifications: string[];
  minTechnicalScore: number;
  requiresTaxClearance?: boolean;
}

export interface TenderDocumentReq {
  id: string;
  name: string;
  mandatory: boolean;
  description?: string;
}

export interface TenderTargetBenefits {
  costOptimization?: string;
  technicalExcellence?: string;
  timelineVelocity?: string;
  sustainabilityESG?: string;
  warrantyAndSLA?: string;
  requiredBenefitsList?: string[];
}

export interface Tender {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  category: string;
  department: string;
  budget: number;
  currency: string;
  publishedDate: string;
  deadline: string; // ISO date string
  status: TenderStatus;
  eligibilityCriteria: TenderEligibilityCriteria;
  requiredDocuments: string[];
  assignedEvaluators: string[]; // User IDs
  targetBenefits?: TenderTargetBenefits;
  awardedBidId?: string;
  awardedVendorName?: string;
  awardDate?: string;
  createdAt: string;
  updatedAt: string;
  publishedBy?: string;
}

export interface BidDocument {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadDate: string;
  fileHash: string; // SHA-256 seal
}

export interface BidOfferedBenefits {
  costSavingsAmount?: number;
  costSavingsPercent?: number;
  technicalHighlights?: string[];
  timelineWeeksProposed?: number;
  timelineAdvantageWeeks?: number;
  sustainabilityCommitments?: string[];
  warrantyMonths?: number;
  slaResponseHours?: number;
  localContentPercent?: number;
}

export interface BidBenefitsScorecard {
  costBenefitScore: number;
  technicalBenefitScore: number;
  timelineBenefitScore: number;
  sustainabilityBenefitScore: number;
  warrantyBenefitScore: number;
  keyAdvantages: string[];
  risksOrTradeoffs: string[];
}

export interface Bid {
  id: string;
  tenderId: string;
  vendorId: string;
  vendorName: string;
  vendorProfile: VendorCompanyProfile;
  bidAmount: number;
  proposedTimelineWeeks: number;
  technicalProposalSummary: string;
  documents: BidDocument[];
  cryptoHash: string; // Tamper-evident cryptographic seal
  status: BidStatus;
  submittedAt: string;
  offlineQueued?: boolean;
  offeredBenefits?: BidOfferedBenefits;
  scores?: {
    technicalScore: number; // 0-100
    financialScore: number; // 0-100
    benefitScore?: number;  // 0-100 comprehensive tender benefit score
    combinedScore: number;  // weighted total
    evaluatorRemarks?: string;
    evaluatedBy?: string;
    evaluatedAt?: string;
    benefitsBreakdown?: BidBenefitsScorecard;
  };
}

export interface EvaluationItem {
  id: string;
  tenderId: string;
  bidId: string;
  evaluatorId: string;
  evaluatorName: string;
  technicalScore: number; // 0-100
  financialScore: number; // calculated or scored
  benefitScore?: number; // 0-100
  compliancePassed: boolean;
  remarks: string;
  recommended: boolean;
  submittedAt: string;
}

export interface AIBidEvaluationSummary {
  bidId: string;
  vendorName: string;
  rank: number;
  bidAmount: number;
  combinedScore: number;
  technicalScore: number;
  financialScore: number;
  benefitScore: number;
  eligibilityMet: boolean;
  unmetRequirements: string[];
  benefitsDelivered: string[];
  keyAdvantages: string[];
  risksOrTradeoffs: string[];
  recommendation: 'STRONG_RECOMMEND' | 'QUALIFIED' | 'BELOW_THRESHOLD' | 'DISQUALIFIED';
  aiRationale: string;
  benefitsBreakdown: BidBenefitsScorecard;
}

export interface AITenderEvaluationReport {
  tenderId: string;
  evaluatedAt: string;
  source: 'gemini' | 'algorithmic' | 'fallback';
  executiveSummary: string;
  targetBenefitsAssessed: string[];
  rankings: AIBidEvaluationSummary[];
  recommendedWinner?: {
    bidId: string;
    vendorName: string;
    bidAmount: number;
    budgetSavingsAmount: number;
    budgetSavingsPercent: number;
    primaryBenefitsDelivered: string[];
    justification: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: string;
  targetType: 'tender' | 'bid' | 'evaluation' | 'system';
  targetId: string;
  details: string;
  cryptoSignature?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'award' | 'bid_received' | 'status_change' | 'system';
  timestamp: string;
  read: boolean;
  tenderId?: string;
}

export interface EligibilityPrediction {
  eligibilityScore: number;
  status: 'High Eligibility' | 'Moderate Eligibility' | 'Low Eligibility';
  executiveSummary: string;
  metCriteria: string[];
  unmetCriteria: string[];
  gapAnalysis: string;
  recommendations: string[];
  source?: string;
}

export interface DeadlineAlert {
  tenderId: string;
  tenderTitle: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  daysRemaining: number;
  suggestedAction: string;
}
