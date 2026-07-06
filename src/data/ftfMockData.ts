import { 
  NegativeAccount, DisputeLetter, Lead, CrmTask, 
  CrmNote, CommunicationLog, FundingOffer, AuditLog 
} from '../types/ftf';

export const initialNegativeAccounts: NegativeAccount[] = [
  {
    id: 'neg-1',
    creditor: 'Capital One Charge-Off',
    type: 'Credit Card / Charge-Off',
    balance: 1450,
    status: 'Charged Off / Account Closed',
    strategy: 'FCRA Section 611 Violation - Account reported with incomplete transaction dates',
    lawViolation: '15 U.S.C. § 1681i (FCRA) - Failure to conduct reasonable investigation of inaccurate reporting',
    priority: 'High'
  },
  {
    id: 'neg-2',
    creditor: 'Wells Fargo Home Mortgage',
    type: 'Mortgage / 120 Days Late',
    balance: 245000,
    status: 'Late 120 Days in Feb 2025',
    strategy: 'Metro 2 Formatting Non-Compliance (Field 17 Incorrect)',
    lawViolation: '15 U.S.C. § 1681s-2 - Duty of furnishers of information to provide accurate information',
    priority: 'High'
  },
  {
    id: 'neg-3',
    creditor: 'Alliance One Collections',
    type: 'Medical Collection',
    balance: 380,
    status: 'Active Collection',
    strategy: 'Debt Validation & HIPAA compliance audit',
    lawViolation: 'FDCPA 15 U.S.C. § 1692g - Failure to provide proper verification of debt within 30 days',
    priority: 'Medium'
  },
  {
    id: 'neg-4',
    creditor: 'Toyota Financial Services',
    type: 'Auto Loan / Repo',
    balance: 8900,
    status: 'Repossession / Deficiency Balance',
    strategy: 'UCC Section 9 Violation - Incorrect state liquidation notice of collateral',
    lawViolation: 'Uniform Commercial Code § 9-611 - Insufficient notice before disposition of collateral',
    priority: 'High'
  },
  {
    id: 'neg-5',
    creditor: 'Barclays Credit Card',
    type: 'Inquiry',
    balance: 0,
    status: 'Hard Inquiry on 01/14/2026',
    strategy: 'Permissible Purpose Audit (Section 604 verification)',
    lawViolation: '15 U.S.C. § 1681b - Unlawful inquiry without user written consent or business transaction',
    priority: 'Low'
  }
];

export const generateLetterTemplate = (
  type: string, 
  clientName: string, 
  clientSSN: string, 
  clientAddress: string, 
  recipient: string, 
  accounts: NegativeAccount[]
): DisputeLetter => {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accountsText = accounts.map((acc, index) => 
    `${index + 1}. ACCOUNT: ${acc.creditor}
   - Account Type: ${acc.type}
   - Disputed Dispute Reason: ${acc.strategy}
   - Legal Ground: ${acc.lawViolation}
   - Instruction: Please delete this inaccurate item immediately.`
  ).join('\n\n');

  let subject = '';
  let content = '';

  switch (type) {
    case 'bureau':
      subject = `OFFICIAL DISPUTE NOTICE - DEMAND FOR IMMEDIATE INVESTIGATION & DELETION`;
      content = `Date: ${dateStr}

To: ${recipient}
Dispute Department

RE: NOTICE OF INACCURATE AND UNVERIFIABLE CREDIT LISTINGS

Client Information:
Name: ${clientName}
SSN: ${clientSSN}
Current Address: ${clientAddress}

Dear Dispute Resolution Officer,

I am writing under the authority of the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681i, to formally dispute the following inaccurate, unverified, and non-compliant credit accounts currently reporting on my consumer credit profile. 

According to federal law, any item reporting on my credit history must be 100% accurate, complete, and verifiable. The listings referenced below fail to satisfy these strict statutory mandates:

${accountsText}

As a result, I hereby demand that you conduct a thorough investigation into these items with the direct original data furnishers. If the original source of information cannot verify these items with complete documentary evidence within the federally mandated 30-day window, you must permanently remove them from my credit file as required by 15 U.S.C. § 1681i(a)(5).

Please send an updated copy of my consumer disclosure statement to the address above immediately upon the completion of your investigation.

Thank you for your prompt attention to this matter.

Sincerely,

____________________________________
${clientName}
Digital Signature Authorized`;
      break;

    case 'creditor':
      subject = `FORMAL METRO 2 AUDIT & REMOVAL DEMAND`;
      content = `Date: ${dateStr}

To: ${recipient}
Executive Credit Reporting Unit

RE: INACCURATE AND ILLEGAL RE-REPORTING OF CLOSED ACCOUNT INFORMATION

Dear Compliance Director,

I am writing to dispute your inaccurate reporting of transaction metrics to the national credit reporting agencies. Under 15 U.S.C. § 1681s-2, your organization has a binding federal obligation to refrain from publishing information that you know, or have reasonable cause to believe, is incomplete or inaccurate.

A meticulous audit of my credit disclosures has identified deep compliance errors on the following account associated with your organization:

${accountsText}

Specifically, your organization is reporting conflicting late dates, incorrect deficiency balances, or transaction dates that do not correspond to historical ledgers. This is a severe infraction of the Fair Credit Reporting Act.

Please resolve this error and direct Experian, Equifax, and TransUnion to delete this negative listing in its entirety within 15 business days. Failure to do so will result in immediate escalation to the CFPB and legal counsel under FCRA § 616 and § 617 for statutory damages.

Sincerely,

____________________________________
${clientName}`;
      break;

    case 'validation':
      subject = `formal fdcpa validation demand and cease & desist notice`;
      content = `Date: ${dateStr}

To: ${recipient}
Collections Compliance Department

RE: ACCOUNT VALIDATION DEMAND UNDER 15 U.S.C. § 1692g

Dear Collection Agent,

This is a formal notice sent to your office pursuant to the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692g. I am formally disputing the validity of any alleged debt your company is reporting under my name. 

This is NOT a request for a billing statement. I require full, itemized legal validation including:
1. Proof that your firm has the legal right to collect this specific debt (including chain of title assignment).
2. The original contract or agreement bearing my signature.
3. Complete ledger showing all debits, credits, and interest calculations from the date of default.

Until my dispute is validated in writing, all collection activity, including credit reporting, MUST cease immediately under federal law.

${accountsText}

Should you continue to report this unvalidated listing to credit bureaus, you will be liable for statutory violations of $1,000 per instance.

Sincerely,

____________________________________
${clientName}`;
      break;

    case 'cfpb':
      subject = `consumer financial protection bureau administrative complaint`;
      content = `Date: ${dateStr}

To: Consumer Financial Protection Bureau (CFPB)
Office of Consumer Complaints

RE: SYSTEMIC FCRA VIOLATIONS AND RETALIATORY NON-INVESTIGATION

Complainant: ${clientName}
Address: ${clientAddress}
Against Respondent: ${recipient}

STATEMENT OF FACTS:
The consumer, ${clientName}, sent a certified dispute notice under 15 U.S.C. § 1681i pointing out clear chronological errors on reporting accounts. The respondent failed to conduct a reasonable investigation, instead rubber-stamping the dispute using automated e-OSCAR codes without auditing original physical source documents.

The disputed accounts include:
${accountsText}

The respondent is knowingly publishing fraudulent and inaccurate financial listings that continue to harm my creditworthiness, blocking my access to business funding, personal capital, and standard local interest rates.

I request that the CFPB intervene and order the respondent to fully comply with federal statutes and delete the unverifiable reporting records immediately.

Sincerely,

____________________________________
${clientName}`;
      break;

    case 'ftc':
      subject = `federal trade commission compliance violation report`;
      content = `Date: ${dateStr}

To: Federal Trade Commission
Division of Credit Practices

RE: FTC SAFEGUARDS RULE & FAIR CREDIT REPORTING ACT STATUTORY BREACH

Dear FTC Commissioners,

I am writing to report egregious consumer protection violations by the financial entity: ${recipient}.

As detailed below, this entity has consistently engaged in deceptive reporting practices, failing to maintain reasonable procedures to avoid credit score reporting inaccuracy:

${accountsText}

I declare under penalty of perjury under the laws of the United States that the information provided is correct. I request that the FTC include this report in your enforcement tracking systems against this non-compliant entity.

Sincerely,

____________________________________
${clientName}`;
      break;

    default:
      subject = `General Dispute Letter`;
      content = `Dear Recipient, this is a dispute notice regarding my accounts.`;
  }

  return {
    id: `letter-${Date.now()}`,
    type,
    recipient,
    subject,
    content
  };
};

export const initialLeads: Lead[] = [
  { id: 'lead-1', name: 'Marcus Peterson', email: 'marcus@petersongroup.co', phone: '312-555-0143', status: 'Active', creditScore: 590, fundingGoal: 75000, createdAt: '2026-06-01' },
  { id: 'lead-2', name: 'Elena Rostova', email: 'elena@rostovatax.com', phone: '415-555-0182', status: 'Enrolled', creditScore: 610, fundingGoal: 150000, createdAt: '2026-06-15' },
  { id: 'lead-3', name: 'David Cho', email: 'd.cho@chologistics.net', phone: '213-555-0199', status: 'Qualified', creditScore: 680, fundingGoal: 45000, createdAt: '2026-06-20' },
  { id: 'lead-4', name: 'Sophia Martinez', email: 'sophia@martinezllc.io', phone: '305-555-0112', status: 'Active', creditScore: 625, fundingGoal: 200000, createdAt: '2026-06-25' },
  { id: 'lead-5', name: 'James Wilson', email: 'jwilson@wilsonauto.com', phone: '718-555-0128', status: 'Contacted', creditScore: 540, fundingGoal: 30000, createdAt: '2026-07-01' }
];

export const initialCrmTasks: CrmTask[] = [
  { id: 'task-1', title: 'Follow-up Call with Marcus (Funding Update)', dueDate: '2026-07-10', completed: false, type: 'Call' },
  { id: 'task-2', title: 'Email Bureau Dispute confirmation receipts', dueDate: '2026-07-06', completed: true, type: 'Email' },
  { id: 'task-3', title: 'SMS Sophia about business formation documents', dueDate: '2026-07-12', completed: false, type: 'SMS' },
  { id: 'task-4', title: 'Audit Elena Wells Fargo dispute results', dueDate: '2026-07-08', completed: false, type: 'Other' }
];

export const initialCrmNotes: CrmNote[] = [
  { id: 'note-1', content: 'Client called. Excited about the 3 Wells Fargo corrections. Preparing the second round of disputes for medical collections.', author: 'FTF Admin', createdAt: '2026-07-02 14:30' },
  { id: 'note-2', content: 'Verified LLC tax status with CPA. Client ready for business credit card stack sequence once Equifax score hits 680.', author: 'FTF Broker', createdAt: '2026-06-28 11:15' }
];

export const initialCommunicationLogs: CommunicationLog[] = [
  { id: 'comm-1', type: 'SMS', recipient: 'Marcus Peterson', message: 'FTF Alert: Your dispute letter has been sent to Equifax. Track status inside your client portal.', status: 'Delivered', timestamp: '2026-07-05 09:00' },
  { id: 'comm-2', type: 'Email', recipient: 'Elena Rostova', message: 'Congratulations, 3 negative items were removed from your Experian report! Your score increased by 42 points.', status: 'Sent', timestamp: '2026-07-04 15:45' },
  { id: 'comm-3', type: 'SMS', recipient: 'Sophia Martinez', message: 'You are now eligible for business funding of up to $100,000. Click here to view lenders.', status: 'Delivered', timestamp: '2026-07-03 10:30' }
];

export const mockFundingOffers: FundingOffer[] = [
  { id: 'offer-1', lender: 'Kabbage / American Express', type: 'Business Line of Credit', amount: 50000, odds: 'High', term: '12-Month Flexible Drawdown' },
  { id: 'offer-2', lender: 'OnDeck Financial', type: 'SBA Express Capital Loan', amount: 100000, odds: 'Medium', term: '36-Month Amortized' },
  { id: 'offer-3', lender: 'National Funding Corp', type: 'Merchant Cash Advance (MCA)', amount: 25000, odds: 'High', term: '6-Month Daily Remittance' },
  { id: 'offer-4', lender: 'Chase Business Cards Stacking', type: '0% APR Intro Credit Cards', amount: 45000, odds: 'Medium', term: '0% APR for 18 Months' }
];

export const auditLogs: AuditLog[] = [
  { id: 'log-1', action: 'AES-256 encrypted storage synchronization', ipAddress: '192.168.1.104', device: 'Chrome v126 on Windows 11', timestamp: '2026-07-05 22:00' },
  { id: 'log-2', action: '2FA verification code generated and validated', ipAddress: '24.183.94.212', device: 'Safari on iPhone 15 Pro', timestamp: '2026-07-05 21:14' },
  { id: 'log-3', action: 'SSN file access logged for dispute dispatch', ipAddress: '192.168.1.104', device: 'Chrome v126 on Windows 11', timestamp: '2026-07-05 20:30' },
  { id: 'log-4', action: 'USCIS Form packet compiled securely with SHA-256', ipAddress: '192.168.1.104', device: 'Chrome v126 on Windows 11', timestamp: '2026-07-05 18:45' }
];

export const successRoadmap = [
  { step: 1, title: 'Fix Personal Credit', desc: 'Settle collections, eliminate reporting inaccuracies, and audit historical inquiries to raise personal scores above 680 across all three credit bureaus.', status: 'current' },
  { step: 2, title: 'Build Corporate Foundation', desc: 'Incorporate your LLC or S-Corp, acquire your corporate EIN, draft your operating agreement, and register with Dun & Bradstreet (D-U-N-S).', status: 'upcoming' },
  { step: 3, title: 'Build Business Credit Profiles', desc: 'Secure Tier 1, Tier 2, and Tier 3 net-30 business vendor accounts to report solid trade lines without personal guarantees.', status: 'upcoming' },
  { step: 4, title: 'Obtain High-Limit Funding', desc: 'Leverage optimized personal profile + business ratings to pull zero-interest credit card sequences, business loans, and flexible lines of credit.', status: 'upcoming' },
  { step: 5, title: 'Buy Cash-Flow Assets & Build Wealth', desc: 'Deploy low-cost business funds into real estate, equipment, business acquisitions, or liquid assets to accumulate long-term equity.', status: 'upcoming' }
];

export const financialGuides = [
  {
    title: 'De-mystifying the 35% Payment History Factor',
    content: 'Payment history is the absolute single largest component of credit ratings. A single 30-day late payment can slash scores by up to 110 points. If an account is inaccurately reported as late, the FCRA allows immediate correction and erasure.',
    readTime: '3 min read'
  },
  {
    title: 'Metro 2 Formatting Violations Explained',
    content: 'Metro 2 is the standardized format used by data furnishers to transmit credit data to Equifax, Experian, and TransUnion. Over 70% of collections agencies report Metro 2 files with formatting bugs (e.g., missing status dates or wrong account indicators). When a dispute highlights these technical failures, the bureau is forced to purge the record.',
    readTime: '5 min read'
  },
  {
    title: 'Liquid Asset Growth vs Debt Consolidation',
    content: 'When looking to scale business capabilities, keeping a low debt-to-credit ratio (under 10%) on personal lines enables instant business approvals. Stacking 0% APR business cards allows you to keep business expenses completely isolated from personal files, protecting your score.',
    readTime: '4 min read'
  }
];
