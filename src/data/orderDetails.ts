export type DraftState = 'locked' | 'ready' | 'processing' | 'drafted';
export type VerdictColumnState = 'empty' | 'due' | 'checking' | 'needs_qc' | 'not_found' | 'approved' | 'rejected';
/** @deprecated use VerdictColumnState */
export type VerdictState = VerdictColumnState;
export type ApplicationStatus = 'created' | 'in_progress' | 'ready_to_submit' | 'submitting' | 'awaiting_result' | 'completed' | 'void';

export interface VFSSlot {
  date: string;
  time: string;
  centerId: string;
  centerLabel: string;
  bookingReference: string;
}

export interface PassportDispatch {
  status: 'awaiting' | 'dispatched';
  trackingUrl: string | null;
  updatedAt: string | null;
}

export interface DS160Entry {
  confirmationCode: string;
  loggedAt: string;
}

export interface OFCAppointment {
  date: string;
  time: string;
  locationId: string;
  locationLabel: string;
  loggedAt: string;
}

export interface InterviewAppointment {
  date: string;
  time: string;
  consulateCityId: string;
  consulateCityLabel: string;
  loggedAt: string;
}

export interface Traveller {
  id: string;
  name: string;
  passportNumber?: string;
  dateOfBirth?: string;
  jurisdiction: string;
  embassyRefId: string;
  embassyRefAutoPopulated?: boolean;
  card: string;
  draftState: DraftState;
  verdict: VerdictColumnState;
  autoCheckDueDate?: string;
  slot?: VFSSlot;
  passportDispatch?: PassportDispatch;
  ds160?: DS160Entry;
  ofcAppointment?: OFCAppointment;
  interviewAppointment?: InterviewAppointment;
  applicationStatus: ApplicationStatus;
  manualStatus?: { by: string; at: string };
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
      { id: 'TRV-001', name: 'Rahul Sharma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-002', name: 'Priya Sharma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
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
      { id: 'TRV-003', name: 'Anil Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-004', name: 'Sunita Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-005', name: 'Rohan Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-006', name: 'Kavya Verma', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
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
      { id: 'TRV-007', name: 'Deepak Nair', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-008', name: 'Anjali Nair', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
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
      { id: 'TRV-009', name: 'Farouk Patel', passportNumber: 'P5678901', jurisdiction: 'Mumbai', embassyRefId: 'ZA2025-0112', card: '4521', draftState: 'ready', verdict: 'empty', applicationStatus: 'ready_to_submit' },
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
      { id: 'TRV-010', name: 'Sanjay Menon', passportNumber: 'M8891234', jurisdiction: 'Delhi', embassyRefId: 'OM2025-0045', card: '8892', draftState: 'drafted', verdict: 'due', autoCheckDueDate: '2026-07-12', applicationStatus: 'awaiting_result' },
      { id: 'TRV-011', name: 'Rekha Menon', jurisdiction: 'Delhi', embassyRefId: '', card: '', draftState: 'ready', verdict: 'empty', applicationStatus: 'ready_to_submit' },
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
      { id: 'TRV-012', name: 'Vikram Singh', passportNumber: 'J4412897', jurisdiction: 'Bangalore', embassyRefId: 'BH2025-0033', card: '3341', draftState: 'drafted', verdict: 'due', autoCheckDueDate: '2026-07-14', applicationStatus: 'awaiting_result' },
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
      { id: 'TRV-020', name: 'Amit Kulkarni', passportNumber: 'K7712001', jurisdiction: 'Mumbai', embassyRefId: 'ID2025-0201', card: '7712', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
      { id: 'TRV-021', name: 'Sneha Kulkarni', passportNumber: 'K7712002', jurisdiction: 'Mumbai', embassyRefId: 'ID2025-0202', card: '7712', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
      { id: 'TRV-022', name: 'Rahul Desai', passportNumber: 'Z3456789', jurisdiction: 'Pune', embassyRefId: 'ID2025-0203', card: '5534', draftState: 'drafted', verdict: 'needs_qc', applicationStatus: 'awaiting_result' },
      { id: 'TRV-023', name: 'Pooja Desai', passportNumber: 'Z3456790', jurisdiction: 'Pune', embassyRefId: 'ID2025-0204', card: '5534', draftState: 'drafted', verdict: 'needs_qc', applicationStatus: 'awaiting_result' },
      { id: 'TRV-024', name: 'Kiran Rao', jurisdiction: '', embassyRefId: '', card: '', draftState: 'ready', verdict: 'empty', applicationStatus: 'ready_to_submit' },
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
      { id: 'TRV-030', name: 'Siddharth Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-031', name: 'Nandini Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-032', name: 'Aryan Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-033', name: 'Riya Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
      { id: 'TRV-034', name: 'Vihaan Joshi', jurisdiction: '', embassyRefId: '', card: '', draftState: 'locked', verdict: 'empty', applicationStatus: 'created' },
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
    taNote: 'Client travelling for business conference — please prioritise.',
    assignee: 'Arjun Pillai',
    status: 'Processing',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      {
        id: 'TRV-040',
        name: 'Pradeep Iyer',
        passportNumber: 'P1234567',
        dateOfBirth: '1978-04-22',
        jurisdiction: 'Mumbai',
        embassyRefId: 'VFS-MUM-20260720-4812',
        embassyRefAutoPopulated: true,
        card: '',
        draftState: 'ready',
        verdict: 'empty',
        applicationStatus: 'in_progress',
        slot: {
          date: '2026-07-20',
          time: '10:00',
          centerId: 'CHE_MUM',
          centerLabel: 'Mumbai VFS Global',
          bookingReference: 'VFS-MUM-20260720-4812',
        },
        passportDispatch: { status: 'awaiting', trackingUrl: null, updatedAt: null },
      },
      {
        id: 'TRV-041',
        name: 'Lakshmi Iyer',
        passportNumber: 'P7654321',
        dateOfBirth: '1981-09-15',
        jurisdiction: 'Mumbai',
        embassyRefId: '',
        card: '',
        draftState: 'locked',
        verdict: 'empty',
        applicationStatus: 'in_progress',
        passportDispatch: { status: 'awaiting', trackingUrl: null, updatedAt: null },
      },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jun 6, 1:00 PM' },
      { actor: 'Arjun Pillai', action: 'Documents mapped', time: 'Jun 7, 9:00 AM' },
      { actor: 'System', action: 'VFS slot booked for Pradeep Iyer — 20 Jul 10:00 AM', time: 'Jun 7, 10:15 AM' },
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
      { id: 'TRV-050', name: 'Nikhil Bhat', jurisdiction: 'Hyderabad', embassyRefId: 'IL2025-0009', card: '2290', draftState: 'ready', verdict: 'empty', applicationStatus: 'ready_to_submit' },
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
      { id: 'TRV-060', name: 'Gaurav Mehta', passportNumber: 'S6612001', jurisdiction: 'Chennai', embassyRefId: 'VN2025-0801', card: '6612', draftState: 'drafted', verdict: 'checking', applicationStatus: 'awaiting_result' },
      { id: 'TRV-061', name: 'Ritu Mehta', passportNumber: 'S6612002', jurisdiction: 'Chennai', embassyRefId: 'VN2025-0802', card: '6612', draftState: 'drafted', verdict: 'not_found', applicationStatus: 'awaiting_result' },
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
      { id: 'TRV-062', name: 'Suresh Pillai', passportNumber: 'R9981003', jurisdiction: 'Kochi', embassyRefId: 'VN2025-0803', card: '9981', draftState: 'drafted', verdict: 'checking', applicationStatus: 'awaiting_result' },
      { id: 'TRV-063', name: 'Latha Pillai', passportNumber: 'R9981004', jurisdiction: 'Kochi', embassyRefId: 'VN2025-0804', card: '9981', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
      { id: 'TRV-064', name: 'Dev Pillai', passportNumber: 'R9981005', jurisdiction: 'Kochi', embassyRefId: 'VN2025-0805', card: '9981', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
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
      { id: 'TRV-065', name: 'Anita Rao', jurisdiction: 'Bangalore', embassyRefId: 'VN2025-0440', card: '1123', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
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
      { id: 'TRV-070', name: 'Rajesh Kumar', jurisdiction: 'Delhi', embassyRefId: 'AE2025-0221', card: '4412', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
      { id: 'TRV-071', name: 'Sunita Kumar', jurisdiction: 'Delhi', embassyRefId: 'AE2025-0222', card: '4412', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
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
      { id: 'TRV-080', name: 'Vijay Nambiar', passportNumber: 'N7723001', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0041', card: '7723', draftState: 'drafted', verdict: 'not_found', applicationStatus: 'awaiting_result' },
      { id: 'TRV-081', name: 'Sheela Nambiar', passportNumber: 'N7723002', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0042', card: '7723', draftState: 'drafted', verdict: 'due', autoCheckDueDate: '2026-07-11', applicationStatus: 'awaiting_result' },
      { id: 'TRV-082', name: 'Asha Nambiar', passportNumber: 'N7723003', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0043', card: '7723', draftState: 'drafted', verdict: 'checking', applicationStatus: 'awaiting_result' },
      { id: 'TRV-083', name: 'Rajan Nambiar', passportNumber: 'N7723004', jurisdiction: 'Kochi', embassyRefId: 'TW2025-0044', card: '7723', draftState: 'drafted', verdict: 'empty', applicationStatus: 'awaiting_result' },
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
      { id: 'TRV-090', name: 'Harish Gupta', jurisdiction: 'Mumbai', embassyRefId: 'CN2025-0019', card: '8834', draftState: 'drafted', verdict: 'approved', applicationStatus: 'completed' },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'May 30, 10:00 AM' },
      { actor: 'Jitendra Kumar', action: 'Documents mapped', time: 'May 30, 2:00 PM' },
      { actor: 'System', action: 'Submitted to embassy', time: 'May 31, 9:00 AM' },
      { actor: 'System', action: 'Verdict received: Approved', time: 'Jun 3, 4:00 PM' },
    ],
  },

  'SMV-USA-00101': {
    orderId: 'SMV-USA-00101',
    paymentPaid: true,
    taNote: 'DS-160 submitted for Arjun and Priya. Awaiting OFC + interview appointment confirmations from Krishna Booking.',
    assignee: 'Meera Nair',
    status: 'Processing',
    addOns: [],
    remarks: '',
    documentsMapped: true,
    travellers: [
      {
        id: 'TRV-091',
        name: 'Arjun Malhotra',
        passportNumber: 'M8812001',
        jurisdiction: '',
        embassyRefId: '',
        card: '',
        draftState: 'drafted',
        verdict: 'empty',
        applicationStatus: 'awaiting_result',
        ds160: { confirmationCode: 'AA-123-45678', loggedAt: '2026-07-08T10:30:00Z' },
        ofcAppointment: { date: '2026-07-14', time: '09:00', locationId: 'mumbai-ofc', locationLabel: 'Mumbai OFC', loggedAt: '2026-07-08T11:00:00Z' },
      },
      {
        id: 'TRV-092',
        name: 'Priya Malhotra',
        passportNumber: 'M8812002',
        jurisdiction: '',
        embassyRefId: '',
        card: '',
        draftState: 'drafted',
        verdict: 'empty',
        applicationStatus: 'awaiting_result',
        ds160: { confirmationCode: 'BB-456-78901', loggedAt: '2026-07-08T10:35:00Z' },
      },
      {
        id: 'TRV-093',
        name: 'Kabir Malhotra',
        jurisdiction: '',
        embassyRefId: '',
        card: '',
        draftState: 'locked',
        verdict: 'empty',
        applicationStatus: 'created',
      },
    ],
    chatMessages: [],
    historyEvents: [
      { actor: 'System', action: 'Order created', time: 'Jul 8, 9:00 AM' },
      { actor: 'Meera Nair', action: 'DS-160 logged for Arjun Malhotra — AA-123-45678', time: 'Jul 8, 10:30 AM' },
      { actor: 'Meera Nair', action: 'DS-160 logged for Priya Malhotra — BB-456-78901', time: 'Jul 8, 10:35 AM' },
      { actor: 'Meera Nair', action: 'OFC appointment logged for Arjun Malhotra — Jul 14, 9:00 AM, Mumbai OFC', time: 'Jul 8, 11:00 AM' },
    ],
  },
};

export function getOrderDetail(orderId: string): OrderDetail | null {
  return ORDER_DETAILS[orderId] ?? null;
}

export function getAllOrders() {
  return ORDER_DETAILS;
}
