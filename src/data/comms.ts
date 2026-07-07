export interface CommTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // icon name string - we'll map it in the component
  category: string;
}

export interface CommHistoryItem {
  id: string;
  type: 've_sent' | 'ta_initiated';
  templateId: string | null;
  templateName: string;
  sender: string;
  senderEmail: string;
  recipients: string[];
  cc: string[];
  subject: string;
  body: string;
  sentAt: string; // display string
  sentAtDate: Date;
  status: 'delivered' | 'failed' | 'pending';
}

export const TEMPLATES: CommTemplate[] = [
  { id: 'courier_received', name: 'Courier received', description: 'Notify TA — documents in QC', icon: 'package', category: 'logistics' },
  { id: 'pendency_list', name: 'Send pendency list', description: 'Documents need review or reupload', icon: 'file_exclamation', category: 'documents' },
  { id: 'empty_order', name: 'Empty order reminder', description: 'No documents uploaded yet', icon: 'shopping_cart', category: 'reminder' },
];

export const TEMPLATE_ICON_COLORS: Record<string, { bg: string; color: string }> = {
  logistics: { bg: '#FFF7E6', color: '#FA8C16' },
  documents: { bg: '#FFF1F0', color: '#CF1322' },
  reminder: { bg: '#E6F4FF', color: '#0958D9' },
};

export const TEMPLATE_BODIES: Record<string, { subject: string; body: string }> = {
  courier_received: {
    subject: 'Documents received — {{order_id}}',
    body: `Dear {{ta_name}},\n\nWe have received the courier documents for Order {{order_id}} ({{country}} visa, travel {{travel_dates}}).\n\nOur team is currently reviewing your documents. We will notify you once the quality check is complete.\n\nRegards,\nStamp My Visa Team`,
  },
  pendency_list: {
    subject: 'Pendency list — {{order_id}}',
    body: `Dear {{ta_name}},\n\nWe are processing the {{country}} visa application for Order {{order_id}}. We need the following documents to proceed:\n\n{{pendency_list}}\n\nPlease upload them at your earliest convenience.\n\nRegards,\nStamp My Visa Team`,
  },
  empty_order: {
    subject: 'Action required — documents pending for {{order_id}}',
    body: `Dear {{ta_name}},\n\nWe have not yet received any documents for Order {{order_id}} ({{country}} visa).\n\nThe travel dates are {{travel_dates}}. Please upload the required documents at the earliest to avoid delays.\n\nRegards,\nStamp My Visa Team`,
  },
};

// Mock history per order
export const MOCK_HISTORY: Record<string, CommHistoryItem[]> = {
  'SMV-OMN-00494': [
    {
      id: 'ch-001',
      type: 've_sent',
      templateId: 'pendency_list',
      templateName: 'Send pendency list',
      sender: 'Meera Nair',
      senderEmail: 'meera@stampmyvisa.com',
      recipients: ['agent@makemytrip.com'],
      cc: ['ops@stampmyvisa.com'],
      subject: 'Pendency list — SMV-OMN-00494',
      body: `Dear Raj,\n\nWe are processing the Oman visa application for Order SMV-OMN-00494. We need the following documents to proceed:\n\n• Passport copy (clear scan)\n• Photograph (white background)\n\nPlease upload them at your earliest convenience.\n\nRegards,\nStamp My Visa Team`,
      sentAt: 'Jun 10, 3:00 PM',
      sentAtDate: new Date('2026-06-10T15:00:00'),
      status: 'delivered',
    },
    {
      id: 'ch-002',
      type: 'ta_initiated',
      templateId: null,
      templateName: 'TA message',
      sender: 'Rajesh Kumar',
      senderEmail: 'agent@makemytrip.com',
      recipients: ['meera@stampmyvisa.com'],
      cc: [],
      subject: 'Re: Pendency list — SMV-OMN-00494',
      body: `Hi Meera,\n\nI have uploaded the passport copy. The photograph will be shared by tomorrow.\n\nThanks,\nRajesh`,
      sentAt: 'Jun 10, 4:30 PM',
      sentAtDate: new Date('2026-06-10T16:30:00'),
      status: 'delivered',
    },
  ],
  'SMV-ZFA-00450': [
    {
      id: 'ch-003',
      type: 've_sent',
      templateId: 'courier_received',
      templateName: 'Courier received',
      sender: 'Jitendra Kumar',
      senderEmail: 'jitendra@stampmyvisa.com',
      recipients: ['ta@company.com'],
      cc: [],
      subject: 'Documents received — SMV-ZFA-00450',
      body: `Dear TA,\n\nWe have received the courier documents for Order SMV-ZFA-00450.\n\nOur team is reviewing. We'll update you shortly.\n\nRegards,\nStamp My Visa Team`,
      sentAt: 'Jun 9, 11:00 AM',
      sentAtDate: new Date('2026-06-09T11:00:00'),
      status: 'delivered',
    },
  ],
};

export function getMockHistory(orderId: string): CommHistoryItem[] {
  return (MOCK_HISTORY[orderId] ?? []).sort(
    (a, b) => b.sentAtDate.getTime() - a.sentAtDate.getTime()
  );
}

// Simulate a suggestion based on orderId
export function getMockSuggestion(orderId: string): { templateId: string; reason: string } | null {
  if (orderId === 'SMV-VNM-15621' || orderId === 'SMV-AZE-02569') {
    return { templateId: 'empty_order', reason: 'No documents uploaded · 48h since order created' };
  }
  if (orderId === 'SMV-ZFA-00450') {
    return { templateId: 'courier_received', reason: 'Courier add-on active on this order' };
  }
  return null;
}
