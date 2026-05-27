// Mock data for Advisorly - Andorran Banking Compliance

export type ObligationStatus = 'compliant' | 'in_progress' | 'overdue' | 'not_started';
export type RiskTier = 'low' | 'medium' | 'high';
export type SARStatus = 'pending' | 'submitted' | 'closed';

export interface Obligation {
  id: string;
  regulation: string;
  regulationCode: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: ObligationStatus;
  evidenceCount: number;
  category: string;
  color: string;
}

export interface KYCClient {
  id: string;
  name: string;
  accountRef: string;
  onboardingDate: string;
  reviewDueDate: string;
  riskTier: RiskTier;
  documentsReceived: string[];
  documentsMissing: string[];
  status: 'current' | 'due_soon' | 'overdue';
}

export interface SAREntry {
  id: string;
  date: string;
  clientRef: string;
  description: string;
  submittedToUIFAND: boolean;
  submissionDate?: string;
  followUpStatus: SARStatus;
  referenceNumber?: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  regulation: string;
  obligationId: string;
  uploadDate: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
}

export const obligations: Obligation[] = [
  {
    id: 'obl-001',
    regulation: 'AML Law 14/2017',
    regulationCode: 'AML',
    title: 'Annual AML Risk Assessment',
    description: 'Conduct and document a comprehensive money laundering and terrorist financing risk assessment for the institution.',
    owner: 'Maria Coma',
    dueDate: '2024-03-31',
    status: 'compliant',
    evidenceCount: 4,
    category: 'Risk Assessment',
    color: '#4F7CFF',
  },
  {
    id: 'obl-002',
    regulation: 'AML Law 14/2017',
    regulationCode: 'AML',
    title: 'Customer Due Diligence Procedures',
    description: 'Maintain and enforce written CDD procedures including enhanced due diligence for high-risk clients.',
    owner: 'Pere Vila',
    dueDate: '2024-06-30',
    status: 'in_progress',
    evidenceCount: 2,
    category: 'Customer Due Diligence',
    color: '#4F7CFF',
  },
  {
    id: 'obl-003',
    regulation: 'AML Law 14/2017',
    regulationCode: 'AML',
    title: 'UIFAND Suspicious Activity Reporting',
    description: 'Submit all suspicious transaction reports to UIFAND within the required timeframe.',
    owner: 'Maria Coma',
    dueDate: '2024-02-15',
    status: 'overdue',
    evidenceCount: 1,
    category: 'Reporting',
    color: '#4F7CFF',
  },
  {
    id: 'obl-004',
    regulation: 'MiFID II (Law 7/2024)',
    regulationCode: 'MIFID',
    title: 'Client Suitability Assessments',
    description: 'Perform and document suitability assessments for all investment advice and portfolio management clients.',
    owner: 'Joan Mas',
    dueDate: '2024-04-30',
    status: 'in_progress',
    evidenceCount: 3,
    category: 'Client Protection',
    color: '#10B981',
  },
  {
    id: 'obl-005',
    regulation: 'MiFID II (Law 7/2024)',
    regulationCode: 'MIFID',
    title: 'Best Execution Policy Review',
    description: 'Annual review and update of the best execution policy, including evidence of compliance.',
    owner: 'Joan Mas',
    dueDate: '2024-12-31',
    status: 'not_started',
    evidenceCount: 0,
    category: 'Trading',
    color: '#10B981',
  },
  {
    id: 'obl-006',
    regulation: 'MiFID II (Law 7/2024)',
    regulationCode: 'MIFID',
    title: 'Product Governance Review',
    description: 'Review and document product governance arrangements for all distributed financial instruments.',
    owner: 'Anna Puig',
    dueDate: '2024-05-15',
    status: 'compliant',
    evidenceCount: 5,
    category: 'Product Oversight',
    color: '#10B981',
  },
  {
    id: 'obl-007',
    regulation: 'AFA Annual Review',
    regulationCode: 'AFA',
    title: 'AFA Supervisory Return Q1',
    description: 'Submit quarterly supervisory return to AFA covering key prudential and conduct metrics.',
    owner: 'Pere Vila',
    dueDate: '2024-04-15',
    status: 'in_progress',
    evidenceCount: 2,
    category: 'Regulatory Reporting',
    color: '#F59E0B',
  },
  {
    id: 'obl-008',
    regulation: 'AFA Annual Review',
    regulationCode: 'AFA',
    title: 'Internal Audit Programme',
    description: 'Execute and document the annual internal audit programme per AFA governance requirements.',
    owner: 'Maria Coma',
    dueDate: '2024-11-30',
    status: 'not_started',
    evidenceCount: 0,
    category: 'Governance',
    color: '#F59E0B',
  },
  {
    id: 'obl-009',
    regulation: 'CRS/FATCA',
    regulationCode: 'CRS',
    title: 'CRS Annual Reporting',
    description: 'Prepare and submit Common Reporting Standard data to Andorran tax authorities for transmission to OECD.',
    owner: 'Anna Puig',
    dueDate: '2024-06-30',
    status: 'compliant',
    evidenceCount: 6,
    category: 'Tax Reporting',
    color: '#8B5CF6',
  },
  {
    id: 'obl-010',
    regulation: 'CRS/FATCA',
    regulationCode: 'CRS',
    title: 'FATCA IGA Compliance',
    description: 'Ensure FATCA due diligence and reporting obligations are met under the US-Andorra IGA.',
    owner: 'Anna Puig',
    dueDate: '2024-09-30',
    status: 'in_progress',
    evidenceCount: 3,
    category: 'Tax Reporting',
    color: '#8B5CF6',
  },
];

export const kycClients: KYCClient[] = [
  {
    id: 'kyc-001',
    name: 'Inversions Pirineu SL',
    accountRef: 'ACC-10042',
    onboardingDate: '2022-03-15',
    reviewDueDate: '2024-03-15',
    riskTier: 'high',
    documentsReceived: ['Passport', 'Proof of Address', 'Source of Funds', 'UBO Declaration'],
    documentsMissing: ['Enhanced DD Report'],
    status: 'overdue',
  },
  {
    id: 'kyc-002',
    name: 'Família Reig — Personal Account',
    accountRef: 'ACC-10089',
    onboardingDate: '2023-01-20',
    reviewDueDate: '2024-04-20',
    riskTier: 'medium',
    documentsReceived: ['Passport', 'Proof of Address', 'Source of Wealth'],
    documentsMissing: ['Tax Residency Certificate'],
    status: 'due_soon',
  },
  {
    id: 'kyc-003',
    name: 'Andorra Trade Partners SA',
    accountRef: 'ACC-10112',
    onboardingDate: '2021-07-08',
    reviewDueDate: '2024-07-08',
    riskTier: 'low',
    documentsReceived: ['Certificate of Incorporation', 'Passport (Directors)', 'Proof of Address', 'UBO Declaration', 'Financial Statements'],
    documentsMissing: [],
    status: 'current',
  },
  {
    id: 'kyc-004',
    name: 'Grup Immobiliari del Catllar',
    accountRef: 'ACC-10134',
    onboardingDate: '2023-06-12',
    reviewDueDate: '2024-06-12',
    riskTier: 'high',
    documentsReceived: ['Passport', 'Certificate of Incorporation'],
    documentsMissing: ['Source of Funds', 'UBO Declaration', 'Enhanced DD Report'],
    status: 'due_soon',
  },
  {
    id: 'kyc-005',
    name: 'Senyor Marc Bartumeu',
    accountRef: 'ACC-10178',
    onboardingDate: '2023-11-01',
    reviewDueDate: '2025-11-01',
    riskTier: 'low',
    documentsReceived: ['Passport', 'Proof of Address', 'Employment Letter'],
    documentsMissing: [],
    status: 'current',
  },
  {
    id: 'kyc-006',
    name: 'Escaldes Holding BV',
    accountRef: 'ACC-10203',
    onboardingDate: '2020-04-22',
    reviewDueDate: '2024-02-22',
    riskTier: 'high',
    documentsReceived: ['Certificate of Incorporation', 'Passport (Directors)', 'UBO Declaration'],
    documentsMissing: ['Updated Source of Funds', 'Latest Financial Statements', 'Enhanced DD Report'],
    status: 'overdue',
  },
  {
    id: 'kyc-007',
    name: 'Senyora Carme Viladomat',
    accountRef: 'ACC-10215',
    onboardingDate: '2022-09-14',
    reviewDueDate: '2024-09-14',
    riskTier: 'low',
    documentsReceived: ['Passport', 'Proof of Address'],
    documentsMissing: [],
    status: 'current',
  },
];

export const sarEntries: SAREntry[] = [
  {
    id: 'sar-001',
    date: '2024-01-08',
    clientRef: 'ACC-10042',
    description: 'Multiple high-value cash deposits over 7-day period inconsistent with declared business activity. Total amount exceeds €250,000. Pattern suggests possible structuring.',
    submittedToUIFAND: true,
    submissionDate: '2024-01-10',
    followUpStatus: 'submitted',
    referenceNumber: 'UIFAND-2024-0041',
  },
  {
    id: 'sar-002',
    date: '2024-02-14',
    clientRef: 'ACC-10203',
    description: 'Unusual wire transfers to jurisdictions flagged as high-risk. Transfers do not match declared purpose of account. Client unresponsive to clarification requests.',
    submittedToUIFAND: true,
    submissionDate: '2024-02-16',
    followUpStatus: 'closed',
    referenceNumber: 'UIFAND-2024-0087',
  },
  {
    id: 'sar-003',
    date: '2024-03-22',
    clientRef: 'ACC-10089',
    description: 'Transaction pattern inconsistent with client profile. Rapid movement of funds through account with no apparent business rationale. Funds originate from previously undisclosed entity.',
    submittedToUIFAND: false,
    followUpStatus: 'pending',
  },
];

export const evidenceFiles: EvidenceFile[] = [
  {
    id: 'ev-001',
    name: 'AML_Risk_Assessment_2024.pdf',
    regulation: 'AML Law 14/2017',
    obligationId: 'obl-001',
    uploadDate: '2024-01-15',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    uploadedBy: 'Maria Coma',
  },
  {
    id: 'ev-002',
    name: 'Risk_Methodology_Framework_v3.docx',
    regulation: 'AML Law 14/2017',
    obligationId: 'obl-001',
    uploadDate: '2024-01-15',
    fileType: 'DOCX',
    fileSize: '890 KB',
    uploadedBy: 'Maria Coma',
  },
  {
    id: 'ev-003',
    name: 'Board_Approval_Risk_Assessment.pdf',
    regulation: 'AML Law 14/2017',
    obligationId: 'obl-001',
    uploadDate: '2024-01-22',
    fileType: 'PDF',
    fileSize: '340 KB',
    uploadedBy: 'Pere Vila',
  },
  {
    id: 'ev-004',
    name: 'CDD_Policy_v5_Signed.pdf',
    regulation: 'AML Law 14/2017',
    obligationId: 'obl-002',
    uploadDate: '2024-02-01',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    uploadedBy: 'Pere Vila',
  },
  {
    id: 'ev-005',
    name: 'Suitability_Policy_MiFIDII_2024.pdf',
    regulation: 'MiFID II (Law 7/2024)',
    obligationId: 'obl-004',
    uploadDate: '2024-02-10',
    fileType: 'PDF',
    fileSize: '3.1 MB',
    uploadedBy: 'Joan Mas',
  },
  {
    id: 'ev-006',
    name: 'CRS_Submission_Confirmation_2023.pdf',
    regulation: 'CRS/FATCA',
    obligationId: 'obl-009',
    uploadDate: '2023-06-30',
    fileType: 'PDF',
    fileSize: '456 KB',
    uploadedBy: 'Anna Puig',
  },
];

export const stats = {
  totalObligations: obligations.length,
  compliant: obligations.filter(o => o.status === 'compliant').length,
  inProgress: obligations.filter(o => o.status === 'in_progress').length,
  overdue: obligations.filter(o => o.status === 'overdue').length,
  notStarted: obligations.filter(o => o.status === 'not_started').length,
  totalClients: kycClients.length,
  kycOverdue: kycClients.filter(c => c.status === 'overdue').length,
  kycDueSoon: kycClients.filter(c => c.status === 'due_soon').length,
  pendingSARs: sarEntries.filter(s => s.followUpStatus === 'pending').length,
  totalEvidence: evidenceFiles.length,
};