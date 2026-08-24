import { SafetyAssessment, PaymentFormData } from '../types';

export const INITIAL_MOCK_HISTORY: SafetyAssessment[] = [
  {
    id: 'chk_demo_01',
    score: 32,
    riskLevel: 'REVIEW',
    statusText: 'Review',
    factors: [
      {
        id: 'first-time-recipient',
        iconType: 'warning',
        title: 'First-time recipient',
        detectedText: 'You haven\'t sent money to "Rahul Enterprises" before.',
        whyItMattersText: 'Sending money to a new recipient carries higher risk because you have no verified track record together.',
        severity: 'medium',
      },
      {
        id: 'high-transaction-amount',
        iconType: 'amount',
        title: 'High payment amount',
        detectedText: 'The payment amount (₹50,000) is significant.',
        whyItMattersText: 'Large payments are difficult or impossible to recover once sent, making independent verification especially important.',
        severity: 'high',
      },
      {
        id: 'urgent-request',
        iconType: 'clock',
        title: 'Urgent payment request',
        detectedText: 'The request asks you to pay immediately or under time pressure.',
        whyItMattersText: 'Artificial urgency is a common tactic to rush you into paying before you have time to check the details.',
        severity: 'high',
      }
    ],
    recommendation: 'Verify the recipient through an independent, trusted phone number or channel before paying.',
    breakdown: [
      { category: 'Recipient Identity', label: 'New Recipient', status: 'review', detail: 'No previous history' },
      { category: 'Transaction Size', label: 'High Value', status: 'high', detail: '₹50,000 exceeds standard limit' },
      { category: 'Decision Context', label: 'Urgent Pressure', status: 'high', detail: 'Immediate action demanded' },
    ],
    paymentDetails: {
      amount: 50000,
      recipient: 'Rahul Enterprises',
      isFirstTime: true,
      isUrgent: true,
      purpose: 'Vendor invoice settlement',
      isUnusualMethod: false,
    },
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    decisionStatus: 'acknowledged',
  },
  {
    id: 'chk_demo_02',
    score: 92,
    riskLevel: 'LOW',
    statusText: 'Low Risk',
    factors: [],
    recommendation: 'Parameters align with established low-risk profile. Proceed with standard awareness.',
    breakdown: [
      { category: 'Recipient Identity', label: 'Known Contact', status: 'ok', detail: 'Regular trusted payee' },
      { category: 'Transaction Size', label: 'Standard Value', status: 'ok', detail: '₹4,500 routine amount' },
      { category: 'Decision Context', label: 'Normal Pacing', status: 'ok', detail: 'No time pressure' },
    ],
    paymentDetails: {
      amount: 4500,
      recipient: 'Anjali Sharma (Apartment Maintenance)',
      isFirstTime: false,
      isUrgent: false,
      purpose: 'Monthly building maintenance fee',
      isUnusualMethod: false,
    },
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    decisionStatus: 'acknowledged',
  },
  {
    id: 'chk_demo_03',
    score: 22,
    riskLevel: 'HIGH',
    statusText: 'High Risk',
    factors: [
      {
        id: 'first-time-recipient',
        iconType: 'warning',
        title: 'First-time recipient',
        detectedText: 'You haven\'t sent money to "TechSupport Helpdesk Direct" before.',
        whyItMattersText: 'Unverified service accounts commonly spoof recognizable brand names.',
        severity: 'medium',
      },
      {
        id: 'urgent-request',
        iconType: 'clock',
        title: 'Urgent payment request',
        detectedText: 'Caller claimed account suspension if not settled in 15 minutes.',
        whyItMattersText: 'Threats of immediate penalties are a frequent tactic used in payment deception.',
        severity: 'high',
      },
      {
        id: 'unusual-channel',
        iconType: 'channel',
        title: 'Unusual payment method',
        detectedText: 'Requested direct QR code via private messaging.',
        whyItMattersText: 'Bypassing official payment gateways removes purchase and dispute protections.',
        severity: 'high',
      }
    ],
    recommendation: 'Stop and independently verify with official customer support through an official website or phone directory.',
    breakdown: [
      { category: 'Recipient Identity', label: 'Unverified Entity', status: 'review', detail: 'Unmatched identifier' },
      { category: 'Channel Security', label: 'Atypical Channel', status: 'high', detail: 'Direct private QR route' },
      { category: 'Decision Context', label: 'High Coercion', status: 'high', detail: 'Immediate penalty threatened' },
    ],
    paymentDetails: {
      amount: 18000,
      recipient: 'TechSupport Helpdesk Direct',
      isFirstTime: true,
      isUrgent: true,
      purpose: 'Security license renewal fee',
      isUnusualMethod: true,
    },
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    decisionStatus: 'cancelled',
  }
];

export const DEMO_PRESETS: { title: string; subtitle: string; data: PaymentFormData }[] = [
  {
    title: 'Urgent Vendor (Score ~32)',
    subtitle: 'First-time + ₹50k + Urgent',
    data: {
      amount: 50000,
      recipient: 'Rahul Enterprises',
      isFirstTime: true,
      isUrgent: true,
      purpose: 'Urgent equipment procurement advance',
      isUnusualMethod: false,
    }
  },
  {
    title: 'Atypical Channel (Score ~22)',
    subtitle: 'Tech Support + QR route',
    data: {
      amount: 18000,
      recipient: 'TechDesk Solutions',
      isFirstTime: true,
      isUrgent: true,
      purpose: 'Urgent server renewal via direct QR',
      isUnusualMethod: true,
    }
  },
  {
    title: 'Routine Monthly Rent (Score ~92)',
    subtitle: 'Known landlord + Normal amount',
    data: {
      amount: 18500,
      recipient: 'Priya Verma (Landlord)',
      isFirstTime: false,
      isUrgent: false,
      purpose: 'Monthly apartment rent for August',
      isUnusualMethod: false,
    }
  }
];
