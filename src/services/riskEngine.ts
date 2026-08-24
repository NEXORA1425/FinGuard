import { PaymentFormData, RiskFactor, RiskFactorBreakdown, SafetyAssessment, RiskLevel } from '../types';

export function calculateSafetyAssessment(form: PaymentFormData): SafetyAssessment {
  const amount = typeof form.amount === 'number' ? form.amount : parseFloat(form.amount || '0') || 0;
  const isFirstTime = form.isFirstTime ?? false;
  const isUrgent = form.isUrgent ?? false;
  const isUnusualMethod = form.isUnusualMethod ?? false;
  const recipient = form.recipient.trim() || 'Recipient';
  const purpose = form.purpose.trim() || 'General Payment';

  const factors: RiskFactor[] = [];
  const breakdown: RiskFactorBreakdown[] = [];

  // Base score calculation (starts at 100 = safest, deductions for risk indicators)
  let riskPenalty = 0;

  // 1. Recipient Familiarity
  if (isFirstTime) {
    riskPenalty += 28;
    factors.push({
      id: 'first-time-recipient',
      iconType: 'warning',
      title: 'First-time recipient',
      detectedText: `You haven't sent money to "${recipient}" before.`,
      whyItMattersText: 'Sending money to a new recipient carries higher risk because you have no verified track record together.',
      severity: 'medium',
    });
    breakdown.push({
      category: 'Recipient Identity',
      label: 'New Recipient',
      status: 'review',
      detail: 'No previous transaction history with this contact.',
    });
  } else {
    breakdown.push({
      category: 'Recipient Identity',
      label: 'Known Contact',
      status: 'ok',
      detail: 'Prior payment history established.',
    });
  }

  // 2. Transaction Amount
  if (amount >= 50000) {
    riskPenalty += 24;
    factors.push({
      id: 'high-transaction-amount',
      iconType: 'amount',
      title: 'High payment amount',
      detectedText: `The payment amount (₹${amount.toLocaleString('en-IN')}) is significant.`,
      whyItMattersText: 'Large payments are difficult or impossible to recover once sent, making independent verification especially important.',
      severity: 'high',
    });
    breakdown.push({
      category: 'Transaction Size',
      label: 'High Value',
      status: 'high',
      detail: `₹${amount.toLocaleString('en-IN')} is a large transfer amount.`,
    });
  } else if (amount >= 15000) {
    riskPenalty += 12;
    factors.push({
      id: 'moderate-transaction-amount',
      iconType: 'amount',
      title: 'Higher-than-usual amount',
      detectedText: `The payment is ₹${amount.toLocaleString('en-IN')}.`,
      whyItMattersText: 'Higher-value transfers benefit from a quick pause to confirm payment details.',
      severity: 'medium',
    });
    breakdown.push({
      category: 'Transaction Size',
      label: 'Moderate Value',
      status: 'review',
      detail: `₹${amount.toLocaleString('en-IN')} is an elevated amount.`,
    });
  } else {
    breakdown.push({
      category: 'Transaction Size',
      label: 'Standard Value',
      status: 'ok',
      detail: `₹${amount.toLocaleString('en-IN')} is a standard transfer amount.`,
    });
  }

  // 3. Urgency Signal
  if (isUrgent) {
    riskPenalty += 26;
    factors.push({
      id: 'urgent-request',
      iconType: 'clock',
      title: 'Urgent payment request',
      detectedText: 'The request asks you to pay immediately or under time pressure.',
      whyItMattersText: 'Artificial urgency is a common tactic to rush you into paying before you have time to check the details.',
      severity: 'high',
    });
    breakdown.push({
      category: 'Decision Context',
      label: 'Urgent Pressure',
      status: 'high',
      detail: 'Request creates time pressure.',
    });
  } else {
    breakdown.push({
      category: 'Decision Context',
      label: 'Normal Pacing',
      status: 'ok',
      detail: 'No artificial time pressure reported.',
    });
  }

  // 4. Unusual Method / Circumvention
  if (isUnusualMethod) {
    riskPenalty += 25;
    factors.push({
      id: 'unusual-channel',
      iconType: 'channel',
      title: 'Unusual payment method',
      detectedText: 'You were asked to pay via an atypical method, direct QR, or third-party route.',
      whyItMattersText: 'Unusual payment channels often bypass standard consumer protection and payment dispute mechanisms.',
      severity: 'high',
    });
    breakdown.push({
      category: 'Channel Security',
      label: 'Unusual Method',
      status: 'high',
      detail: 'Alternative routing requested.',
    });
  } else {
    breakdown.push({
      category: 'Channel Security',
      label: 'Standard Channel',
      status: 'ok',
      detail: 'Standard official payment flow.',
    });
  }

  // Calculate final score bounded between 15 and 96
  const rawScore = Math.max(15, Math.min(96, 100 - riskPenalty));
  
  let riskLevel: RiskLevel = 'LOW';
  let statusText = 'Low Risk';
  let recommendation = 'Payment parameters align with low risk signals. Proceed with normal care.';

  if (rawScore < 45 || factors.length >= 3 || (isUrgent && isFirstTime)) {
    riskLevel = 'HIGH';
    statusText = 'High Risk';
    recommendation = 'Verify the recipient through an independent, trusted phone number or channel before paying.';
  } else if (rawScore < 75 || factors.length > 0) {
    riskLevel = 'REVIEW';
    statusText = 'Review';
    recommendation = 'Take a moment to verify the recipient and payment details before proceeding.';
  }

  // Generate unique assessment ID
  const id = `chk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    id,
    score: rawScore,
    riskLevel,
    statusText,
    factors,
    recommendation,
    breakdown,
    paymentDetails: {
      amount,
      recipient,
      isFirstTime,
      isUrgent,
      purpose,
      isUnusualMethod,
    },
    analyzedAt: new Date().toISOString(),
    decisionStatus: 'pending',
  };
}
