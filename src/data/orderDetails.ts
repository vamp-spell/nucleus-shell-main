export type DraftState = 'locked' | 'ready' | 'done';
export type VerdictState = 'none' | 'fetching' | 'approved' | 'rejected';

export interface Traveller {
  id: string;
  name: string;
  jurisdiction: string;
  embassyRefId: string;
  card: string;
  draftState: DraftState;
  verdict: VerdictState;
}

export interface OrderDetail {
  orderId: string;
  paymentPaid: boolean;
  taNote: string;
  assignee: string;
  status: string;
  addOns: string[];
  remarks: string;
  documentsMapped: boolean;
  travellers: Traveller[];
  chatMessages: { author: string; text: string; time: string; isVE?: boolean }[];
  historyEvents: { actor: string; action: string; time: string }[];
}

const ORDER_DETAILS: Record<string, OrderDetail> = {
  'SMV-VNM-15621': {
    orderId: 'SMV-VNM-15621',
    paymentPaid: true,
    taNote: 'Please prioritise — client is a repeat customer and has a flight booked.',
    assignee: 'Jitendra Kumar',
    status: 'New',
    addOns: ['eSIM'],
    remarks: '',
    documentsMapped: false,
    travellers: [
      { id: 'TRV-001', name: 'Rahul Sharma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-002', name: 'Priya Sharma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 11, 10:02 AM' },
      { actor: 'System', action: 'Assigned to Jitendra Kumar', time: 'Jun 11, 10:03 AM' },
    ],
  },
  'SMV-AZE-02569': {
    orderId: 'SMV-AZE-02569',
    paymentPaid: false,
    taNote: '',
    assignee: 'Meera Nair',
    status: 'New',
    addOns: [],
    remarks: '',
    documentsMapped: false,
    travellers: [
      { id: 'TRV-003', name: 'Anil Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-004', name: 'Sunita Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-005', name: 'Rohan Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-006', name: 'Kavya Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 11, 09:45 AM' },
      { actor: 'System', action: 'Assigned to Meera Nair', time: 'Jun 11, 09:46 AM' },
    ],
  },
  'SMV-SGP-11815': {
    orderId: 'SMV-SGP-11815',
    paymentPaid: true,
    taNote: '',
    assignee: 'Arjun Pillai',
    status: 'New',
    addOns: ['Travel insurance'],
    remarks: '',
    documentsMapped: false,
    travellers: [
      { id: 'TRV-007', name: 'Deepak Nair', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-008', name: 'Anjali Nair', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 11, 11:20 AM' },
    ],
  },
  'SMV-ZFA-00450': {
    orderId: 'SMV-ZFA-00450',
    paymentPaid: true,
    taNote: 'Client changed passport — please re-check documents before submitting.',
    assignee: 'Jitendra Kumar',
    status: 'Processing',
    addOns: [],
    remarks: 'Escalated by VM — SLA breach risk.',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-009', name: 'Farouk Patel', jurisdiction: 'Mumbai', embassyRefId: 'ZA2025-0112', card: '4521', draftState: 'ready', verdict: 'none' },
    ],
    chatMessages: [
      { author: 'Visa Manager', text: 'Please prioritise this order. Client has been waiting 5 days.', time: '2h ago' },
      { author: 'Jitendra Kumar', text: 'On it. Will submit by EOD.', time: '1h 45m ago', isVE: true },
    ],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 9, 2:00 PM' },
      { actor: 'System', action: 'Assigned to Jitendra Kumar', time: 'Jun 9, 2:01 PM' },
      { actor: 'Jitendra Kumar', action: 'Documents mapped', time: 'Jun 10, 10:30 AM' },
      { actor: 'Visa Manager', action: 'Escalated order', time: 'Jun 11, 9:00 AM' },
    ],
  },
  'SMV-OMN-00494': {
    orderId: 'SMV-OMN-00494',
    paymentPaid: true,
    taNote: '',
    assignee: 'Meera Nair',
    status: 'Processing',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-010', name: 'Sanjay Menon', jurisdiction: 'Delhi', embassyRefId: 'OM2025-0045', card: '8892', draftState: 'done', verdict: 'none' },
      { id: 'TRV-011', name: 'Rekha Menon', jurisdiction: 'Delhi', embassyRefId: '', card: '', draftState: 'ready', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 10, 9:00 AM' },
      { actor: 'Meera Nair', action: 'Documents mapped', time: 'Jun 10, 2:00 PM' },
      { actor: 'Meera Nair', action: 'Draft run for TRV-010', time: 'Jun 11, 10:00 AM' },
    ],
  },
  'SMV-BHR-00160': {
    orderId: 'SMV-BHR-00160',
    paymentPaid: true,
    taNote: '',
    assignee: 'Arjun Pillai',
    status: 'Processing',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-012', name: 'Vikram Singh', jurisdiction: 'Bangalore', embassyRefId: 'BH2025-0033', card: '3341', draftState: 'done', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 9, 11:00 AM' },
      { actor: 'Arjun Pillai', action: 'Documents mapped', time: 'Jun 9, 3:00 PM' },
      { actor: 'Arjun Pillai', action: 'Draft run for TRV-012', time: 'Jun 10, 9:30 AM' },
    ],
  },
  'SMV-IDN-12711': {
    orderId: 'SMV-IDN-12711',
    paymentPaid: true,
    taNote: 'Large group — all travellers are for the same corporate retreat.',
    assignee: 'Jitendra Kumar',
    status: 'Processing',
    addOns: ['eSIM', 'Travel insurance'],
    remarks: 'Bulk order — 44 pax. 17 completed.',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-020', name: 'Amit Kulkarni', jurisdiction: 'Mumbai', embassyRefId: 'ID2025-0201', card: '7712', draftState: 'done', verdict: 'approved' },
      { id: 'TRV-021', name: 'Sneha Kulkarni', jurisdiction: 'Mumbai', embassyRefId: 'ID2025-0202', card: '7712', draftState: 'done', verdict: 'approved' },
      { id: 'TRV-022', name: 'Rahul Desai', jurisdiction: 'Pune', embassyRefId: 'ID2025-0203', card: '5534', draftState: 'done', verdict: 'fetching' },
      { id: 'TRV-023', name: 'Pooja Desai', jurisdiction: 'Pune', embassyRefId: '', card: '', draftState: 'ready', verdict: 'none' },
      { id: 'TRV-024', name: 'Kiran Rao', jurisdiction: '', embassyRefId: '', card: '', draftState: 'ready', verdict: 'none' },
    ],
    chatMessages: [
      { author: 'Jitendra Kumar', text: 'Processing batch 1 now. Will update on each set.', time: '30m ago', isVE: true },
    ],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 10, 8:00 AM' },
      { actor: 'Jitendra Kumar', action: 'Documents mapped', time: 'Jun 10, 11:00 AM' },
      { actor: 'System', action: 'OCR run completed — 44 travellers', time: 'Jun 10, 11:15 AM' },
    ],
  },
  'SMV-GEO-00563': {
    orderId: 'SMV-GEO-00563',
    paymentPaid: false,
    taNote: 'Waiting on updated itinerary from client.',
    assignee: 'Meera Nair',
    status: 'Blocked',
    addOns: [],
    remarks: 'Blocked pending TA response.',
    documentsMapped: false,
    travellers: [
      { id: 'TRV-030', name: 'Siddharth Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-031', name: 'Nandini Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-032', name: 'Aryan Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-033', name: 'Riya Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-034', name: 'Vihaan Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 8, 3:00 PM' },
      { actor: 'Meera Nair', action: 'Marked as waiting for TA', time: 'Jun 9, 10:00 AM' },
    ],
  },
  'SMV-CHE-00748': {
    orderId: 'SMV-CHE-00748',
    paymentPaid: true,
    taNote: '',
    assignee: 'Arjun Pillai',
    status: 'Blocked',
    addOns: [],
    remarks: 'Waiting for vendor confirmation.',
    documentsMapped: false,
    travellers: [
      { id: 'TRV-040', name: 'Pradeep Iyer', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
      { id: 'TRV-041', name: 'Lakshmi Iyer', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 6, 1:00 PM' },
      { actor: 'Arjun Pillai', action: 'Marked as waiting for vendor', time: 'Jun 7, 9:00 AM' },
    ],
  },
  'SMV-ISR-00008': {
    orderId: 'SMV-ISR-00008',
    paymentPaid: true,
    taNote: '',
    assignee: 'Jitendra Kumar',
    status: 'Processing',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-050', name: 'Nikhil Bhat', jurisdiction: 'Hyderabad', embassyRefId: 'IL2025-0009', card: '2290', draftState: 'ready', verdict: 'none' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 11, 8:30 AM' },
      { actor: 'Jitendra Kumar', action: 'Documents mapped', time: 'Jun 11, 10:00 AM' },
    ],
  },
  'SMV-VNM-15601': {
    orderId: 'SMV-VNM-15601',
    paymentPaid: true,
    taNote: '',
    assignee: 'Meera Nair',
    status: 'Submitted',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-060', name: 'Gaurav Mehta', jurisdiction: 'Chennai', embassyRefId: 'VN2025-0801', card: '6612', draftState: 'done', verdict: 'fetching' },
      { id: 'TRV-061', name: 'Ritu Mehta', jurisdiction: 'Chennai', embassyRefId: 'VN2025-0802', card: '6612', draftState: 'done', verdict: 'fetching' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 5, 9:00 AM' },
      { actor: 'Meera Nair', action: 'Documents mapped', time: 'Jun 5, 2:00 PM' },
      { actor: 'Meera Nair', action: 'Draft run for all travellers', time: 'Jun 6, 10:00 AM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'Jun 6, 10:30 AM' },
    ],
  },
  'SMV-VNM-15603': {
    orderId: 'SMV-VNM-15603',
    paymentPaid: true,
    taNote: '',
    assignee: 'Arjun Pillai',
    status: 'Submitted',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-062', name: 'Suresh Pillai', jurisdiction: 'Kochi', embassyRefId: 'VN2025-0803', card: '9981', draftState: 'done', verdict: 'fetching' },
      { id: 'TRV-063', name: 'Latha Pillai', jurisdiction: 'Kochi', embassyRefId: 'VN2025-0804', card: '9981', draftState: 'done', verdict: 'approved' },
      { id: 'TRV-064', name: 'Dev Pillai', jurisdiction: 'Kochi', embassyRefId: 'VN2025-0805', card: '9981', draftState: 'done', verdict: 'approved' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 4, 10:00 AM' },
      { actor: 'Arjun Pillai', action: 'Documents mapped', time: 'Jun 5, 9:00 AM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'Jun 5, 4:00 PM' },
      { actor: 'System', action: 'Verdict received: TRV-063 Approved', time: 'Jun 6, 11:00 AM' },
      { actor: 'System', action: 'Verdict received: TRV-064 Approved', time: 'Jun 6, 11:00 AM' },
    ],
  },
  'SMV-VNM-15605': {
    orderId: 'SMV-VNM-15605',
    paymentPaid: true,
    taNote: '',
    assignee: 'Jitendra Kumar',
    status: 'Completed',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-065', name: 'Anita Rao', jurisdiction: 'Bangalore', embassyRefId: 'VN2025-0440', card: '1123', draftState: 'done', verdict: 'approved' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 3, 8:00 AM' },
      { actor: 'Jitendra Kumar', action: 'Documents mapped', time: 'Jun 3, 11:00 AM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'Jun 4, 9:00 AM' },
      { actor: 'System', action: 'Verdict received: Approved', time: 'Jun 5, 3:00 PM' },
    ],
  },
  'SMV-ARE-09438': {
    orderId: 'SMV-ARE-09438',
    paymentPaid: true,
    taNote: '',
    assignee: 'Meera Nair',
    status: 'Submitted',
    addOns: ['eSIM'],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-070', name: 'Rajesh Kumar', jurisdiction: 'Delhi', embassyRefId: 'AE2025-0221', card: '4412', draftState: 'done', verdict: 'approved' },
      { id: 'TRV-071', name: 'Sunita Kumar', jurisdiction: 'Delhi', embassyRefId: 'AE2025-0222', card: '4412', draftState: 'done', verdict: 'approved' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 2, 1:00 PM' },
      { actor: 'Meera Nair', action: 'Documents mapped', time: 'Jun 2, 4:00 PM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'Jun 3, 10:00 AM' },
      { actor: 'System', action: 'Verdict received: Both Approved', time: 'Jun 5, 2:00 PM' },
    ],
  },
  'SMV-TW-00004': {
    orderId: 'SMV-TW-00004',
    paymentPaid: true,
    taNote: '',
    assignee: 'Arjun Pillai',
    status: 'Submitted',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-080', name: 'Vijay Nambiar', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0041', card: '7723', draftState: 'done', verdict: 'fetching' },
      { id: 'TRV-081', name: 'Sheela Nambiar', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0042', card: '7723', draftState: 'done', verdict: 'fetching' },
      { id: 'TRV-082', name: 'Asha Nambiar', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0043', card: '7723', draftState: 'done', verdict: 'fetching' },
      { id: 'TRV-083', name: 'Rajan Nambiar', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0044', card: '7723', draftState: 'done', verdict: 'fetching' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 1, 9:00 AM' },
      { actor: 'Arjun Pillai', action: 'Documents mapped', time: 'Jun 1, 2:00 PM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'Jun 2, 10:00 AM' },
    ],
  },
  'SMV-CHN-00770': {
    orderId: 'SMV-CHN-00770',
    paymentPaid: true,
    taNote: '',
    assignee: 'Jitendra Kumar',
    status: 'Submitted',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      { id: 'TRV-090', name: 'Harish Gupta', jurisdiction: 'Mumbai', embassyRefId: 'CN2025-0019', card: '8834', draftState: 'done', verdict: 'approved' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'May 30, 10:00 AM' },
      { actor: 'Jitendra Kumar', action: 'Documents mapped', time: 'May 30, 2:00 PM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'May 31, 9:00 AM' },
      { actor: 'System', action: 'Verdict received: Approved', time: 'Jun 3, 4:00 PM' },
    ],
  },
};

export function getOrderDetail(orderId: string): OrderDetail | null {
  return ORDER_DETAILS[orderId] ?? null;
}

export function getAllOrders() {
  return ORDER_DETAILS;
}
