export type VerdictDocumentType = 'passport_front' | 'passport_back' | 'visa' | 'arrival_card' | 'other';
export type AICheckResult = 'pass' | 'fail';
export type VEResolution = 'match' | 'confirmed_fail' | null;

export interface DocumentField {
  name: string;
  value: string;
  isFailingField?: boolean; // true if any check on this field fails
}

export interface FieldCheck {
  id: string;
  fieldName: string;
  sourceLabel: string;
  documentLabel: string;
  sourceValue: string;
  documentValue: string;
  aiResult: AICheckResult;
  veResolution: VEResolution;
}

export interface VerdictDocument {
  id: string;
  name: string;
  subType: string;
  type: VerdictDocumentType;
  isAIChecked: boolean;
  checkCount?: number;
  failCount?: number;
  documentFields: DocumentField[];
  checks: FieldCheck[];
}

export interface QCTravellerInfo {
  id: string;
  name: string;
  passportNumber: string;
  country: string;
}

export interface QCOrderInfo {
  orderId: string;
  orderRef: string;
  totalTravellers: number;
  travellers: { id: string; name: string; hasPendingQC: boolean }[];
}

export interface VerdictQCData {
  order: QCOrderInfo;
  traveller: QCTravellerInfo;
  documents: VerdictDocument[];
  overallAIVerdict: 'approved' | 'rejected';
}

const QC_DATA: Record<string, Record<string, VerdictQCData>> = {
  'SMV-IDN-12711': {
    'TRV-022': {
      order: {
        orderId: 'SMV-IDN-12711',
        orderRef: 'SMV-IDN-12711',
        totalTravellers: 5,
        travellers: [
          { id: 'TRV-020', name: 'Amit Kulkarni', hasPendingQC: false },
          { id: 'TRV-021', name: 'Sneha Kulkarni', hasPendingQC: false },
          { id: 'TRV-022', name: 'Rahul Desai', hasPendingQC: true },
          { id: 'TRV-023', name: 'Pooja Desai', hasPendingQC: true },
          { id: 'TRV-024', name: 'Kiran Rao', hasPendingQC: false },
        ],
      },
      traveller: {
        id: 'TRV-022',
        name: 'Rahul Desai',
        passportNumber: 'Z3456789',
        country: 'Indonesia',
      },
      overallAIVerdict: 'rejected',
      documents: [
        {
          id: 'DOC-001',
          name: 'Indonesia E-Visa',
          subType: 'E-visa document · Republic of Indonesia',
          type: 'visa',
          isAIChecked: true,
          checkCount: 6,
          failCount: 1,
          documentFields: [
            { name: 'Visa No.', value: 'ID2025-0203' },
            { name: 'Surname', value: 'DESAI' },
            { name: 'Given name', value: 'RAHUL K', isFailingField: true },
            { name: 'Date of birth', value: '15-03-1985' },
            { name: 'Nationality', value: 'INDIAN' },
            { name: 'Passport No.', value: 'Z3456789' },
            { name: 'Entry type', value: 'Single entry' },
            { name: 'Valid from', value: '15 Jun 2025' },
            { name: 'Valid to', value: '14 Jul 2025' },
          ],
          checks: [
            {
              id: 'CHK-001',
              fieldName: 'Given name',
              sourceLabel: 'Passport',
              documentLabel: 'Visa document',
              sourceValue: 'RAHUL',
              documentValue: 'RAHUL K',
              aiResult: 'fail',
              veResolution: null,
            },
            {
              id: 'CHK-002',
              fieldName: 'Surname',
              sourceLabel: 'Passport',
              documentLabel: 'Visa document',
              sourceValue: 'DESAI',
              documentValue: 'DESAI',
              aiResult: 'pass',
              veResolution: null,
            },
            {
              id: 'CHK-003',
              fieldName: 'Date of birth',
              sourceLabel: 'Passport',
              documentLabel: 'Visa document',
              sourceValue: '15 MAR 1985',
              documentValue: '15-03-1985',
              aiResult: 'pass',
              veResolution: null,
            },
            {
              id: 'CHK-004',
              fieldName: 'Passport number',
              sourceLabel: 'Passport',
              documentLabel: 'Visa document',
              sourceValue: 'Z3456789',
              documentValue: 'Z3456789',
              aiResult: 'pass',
              veResolution: null,
            },
            {
              id: 'CHK-005',
              fieldName: 'Nationality',
              sourceLabel: 'Passport',
              documentLabel: 'Visa document',
              sourceValue: 'INDIAN',
              documentValue: 'INDIAN',
              aiResult: 'pass',
              veResolution: null,
            },
            {
              id: 'CHK-006',
              fieldName: 'Entry type',
              sourceLabel: 'Application',
              documentLabel: 'Visa document',
              sourceValue: 'Single entry',
              documentValue: 'Single entry',
              aiResult: 'pass',
              veResolution: null,
            },
          ],
        },
        {
          id: 'DOC-002',
          name: 'Passport front',
          subType: 'Machine-readable passport · Republic of India',
          type: 'passport_front',
          isAIChecked: true,
          checkCount: 3,
          failCount: 0,
          documentFields: [
            { name: 'Surname', value: 'DESAI' },
            { name: 'Given names', value: 'RAHUL' },
            { name: 'Date of birth', value: '15 MAR 1985' },
            { name: 'Passport No.', value: 'Z3456789' },
            { name: 'Nationality', value: 'INDIAN' },
            { name: 'Expiry date', value: '14 NOV 2032' },
          ],
          checks: [
            {
              id: 'CHK-007',
              fieldName: 'Full name',
              sourceLabel: 'Application',
              documentLabel: 'Passport',
              sourceValue: 'Rahul Desai',
              documentValue: 'RAHUL DESAI',
              aiResult: 'pass',
              veResolution: null,
            },
            {
              id: 'CHK-008',
              fieldName: 'Date of birth',
              sourceLabel: 'Application',
              documentLabel: 'Passport',
              sourceValue: '15 Mar 1985',
              documentValue: '15 MAR 1985',
              aiResult: 'pass',
              veResolution: null,
            },
            {
              id: 'CHK-009',
              fieldName: 'Passport expiry',
              sourceLabel: 'Application',
              documentLabel: 'Passport',
              sourceValue: '14 Nov 2032',
              documentValue: '14 NOV 2032',
              aiResult: 'pass',
              veResolution: null,
            },
          ],
        },
        {
          id: 'DOC-003',
          name: 'Hotel booking',
          subType: 'Accommodation confirmation',
          type: 'other',
          isAIChecked: false,
          documentFields: [
            { name: 'Hotel', value: 'Grand Hyatt Jakarta' },
            { name: 'Check-in', value: '20 Jun 2025' },
            { name: 'Check-out', value: '25 Jun 2025' },
            { name: 'Guest name', value: 'Rahul Desai' },
          ],
          checks: [],
        },
      ],
    },
    'TRV-023': {
      order: {
        orderId: 'SMV-IDN-12711',
        orderRef: 'SMV-IDN-12711',
        totalTravellers: 5,
        travellers: [
          { id: 'TRV-020', name: 'Amit Kulkarni', hasPendingQC: false },
          { id: 'TRV-021', name: 'Sneha Kulkarni', hasPendingQC: false },
          { id: 'TRV-022', name: 'Rahul Desai', hasPendingQC: true },
          { id: 'TRV-023', name: 'Pooja Desai', hasPendingQC: true },
          { id: 'TRV-024', name: 'Kiran Rao', hasPendingQC: false },
        ],
      },
      traveller: {
        id: 'TRV-023',
        name: 'Pooja Desai',
        passportNumber: 'Z3456790',
        country: 'Indonesia',
      },
      overallAIVerdict: 'approved',
      documents: [
        {
          id: 'DOC-004',
          name: 'Indonesia E-Visa',
          subType: 'E-visa document · Republic of Indonesia',
          type: 'visa',
          isAIChecked: true,
          checkCount: 6,
          failCount: 0,
          documentFields: [
            { name: 'Visa No.', value: 'ID2025-0204' },
            { name: 'Surname', value: 'DESAI' },
            { name: 'Given name', value: 'POOJA' },
            { name: 'Date of birth', value: '22-07-1988' },
            { name: 'Nationality', value: 'INDIAN' },
            { name: 'Passport No.', value: 'Z3456790' },
            { name: 'Entry type', value: 'Single entry' },
            { name: 'Valid from', value: '15 Jun 2025' },
            { name: 'Valid to', value: '14 Jul 2025' },
          ],
          checks: [
            { id: 'CHK-010', fieldName: 'Given name', sourceLabel: 'Passport', documentLabel: 'Visa document', sourceValue: 'POOJA', documentValue: 'POOJA', aiResult: 'pass', veResolution: null },
            { id: 'CHK-011', fieldName: 'Surname', sourceLabel: 'Passport', documentLabel: 'Visa document', sourceValue: 'DESAI', documentValue: 'DESAI', aiResult: 'pass', veResolution: null },
            { id: 'CHK-012', fieldName: 'Date of birth', sourceLabel: 'Passport', documentLabel: 'Visa document', sourceValue: '22 JUL 1988', documentValue: '22-07-1988', aiResult: 'pass', veResolution: null },
            { id: 'CHK-013', fieldName: 'Passport number', sourceLabel: 'Passport', documentLabel: 'Visa document', sourceValue: 'Z3456790', documentValue: 'Z3456790', aiResult: 'pass', veResolution: null },
            { id: 'CHK-014', fieldName: 'Nationality', sourceLabel: 'Passport', documentLabel: 'Visa document', sourceValue: 'INDIAN', documentValue: 'INDIAN', aiResult: 'pass', veResolution: null },
            { id: 'CHK-015', fieldName: 'Entry type', sourceLabel: 'Application', documentLabel: 'Visa document', sourceValue: 'Single entry', documentValue: 'Single entry', aiResult: 'pass', veResolution: null },
          ],
        },
        {
          id: 'DOC-005',
          name: 'Passport front',
          subType: 'Machine-readable passport · Republic of India',
          type: 'passport_front',
          isAIChecked: true,
          checkCount: 2,
          failCount: 0,
          documentFields: [
            { name: 'Surname', value: 'DESAI' },
            { name: 'Given names', value: 'POOJA' },
            { name: 'Date of birth', value: '22 JUL 1988' },
            { name: 'Passport No.', value: 'Z3456790' },
            { name: 'Nationality', value: 'INDIAN' },
            { name: 'Expiry date', value: '21 MAR 2031' },
          ],
          checks: [
            { id: 'CHK-016', fieldName: 'Full name', sourceLabel: 'Application', documentLabel: 'Passport', sourceValue: 'Pooja Desai', documentValue: 'POOJA DESAI', aiResult: 'pass', veResolution: null },
            { id: 'CHK-017', fieldName: 'Date of birth', sourceLabel: 'Application', documentLabel: 'Passport', sourceValue: '22 Jul 1988', documentValue: '22 JUL 1988', aiResult: 'pass', veResolution: null },
          ],
        },
      ],
    },
  },
};

export function getVerdictQCData(orderId: string, travellerId: string): VerdictQCData | null {
  return QC_DATA[orderId]?.[travellerId] ?? null;
}
