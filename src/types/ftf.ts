export interface CreditScore {
  experian: number;
  equifax: number;
  transunion: number;
}

export interface NegativeAccount {
  id: string;
  creditor: string;
  type: string;
  balance: number;
  status: string;
  strategy: string;
  lawViolation: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface DisputeLetter {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  content: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Enrolled' | 'Active' | 'Closed';
  creditScore: number;
  fundingGoal: number;
  createdAt: string;
}

export interface CrmTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  type: 'Call' | 'Email' | 'SMS' | 'Other';
}

export interface CrmNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  type: 'SMS' | 'Email' | 'Voice Drop';
  recipient: string;
  message: string;
  status: 'Sent' | 'Delivered' | 'Failed';
  timestamp: string;
}

export interface FundingEligibilityInput {
  revenue: number;
  timeInBusiness: number;
  industry: string;
  creditScore: number;
}

export interface FundingOffer {
  id: string;
  lender: string;
  type: string;
  amount: number;
  odds: 'High' | 'Medium' | 'Low';
  term: string;
}

export interface FormationOrder {
  id: string;
  companyName: string;
  type: 'LLC' | 'Corporation';
  state: string;
  einRequested: boolean;
  operatingAgreementRequested: boolean;
  status: 'Pending Review' | 'Submitted to State' | 'Approved & Completed';
  updatedAt: string;
}

export interface TaxDocument {
  id: string;
  name: string;
  type: 'W2' | '1099' | 'Tax Return' | 'Other';
  uploadedAt: string;
  status: 'Received' | 'In Progress' | 'Filed';
  refundEstimate?: number;
}

export interface ImmigrationCase {
  id: string;
  caseType: string;
  uscisReceiptNumber?: string;
  status: 'Document Gathering' | 'Form Preparation' | 'Filed' | 'Decision Pending' | 'Approved';
  deadline: string;
  requiredDocs: { name: string; completed: boolean }[];
}

export interface AuditLog {
  id: string;
  action: string;
  ipAddress: string;
  device: string;
  timestamp: string;
}
