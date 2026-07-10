export type DocStatus = 'uploaded' | 'pending' | 'not-yet'
export type WhatChanged = 'just-assigned' | 'docs-uploaded' | 'escalated' | 'new-chat' | 'waiting-ta' | 'waiting-vendor' | 'no-change'
export type VisaType = 'EXP' | 'SFT' | 'POP'
export type TabKey = 'new' | 'attention' | 'progress' | 'submitted'

export interface Order {
  id: string
  country: string
  flag: string
  visaType: VisaType
  visaCategory: string
  pax: number
  bulkProgress: { done: number; total: number } | null
  travelDateStart: string
  travelDateEnd: string
  daysAway: number
  agency: string
  docStatus: DocStatus
  whatChanged: WhatChanged
  timeAgo: string
  chatUnread: boolean
  escalated: boolean
  blocked: boolean
  group: string
}

export const newOrders: Order[] = [
  { id: 'SMV-VNM-15621', country: 'Vietnam', flag: '🇻🇳', visaType: 'EXP', visaCategory: 'Single entry', pax: 2, bulkProgress: null, travelDateStart: 'Jun 14', travelDateEnd: 'Jun 19', daysAway: 3, agency: 'Waheguru Travels', docStatus: 'uploaded', whatChanged: 'just-assigned', timeAgo: 'Just now', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-AZE-02569', country: 'Azerbaijan', flag: '🇦🇿', visaType: 'SFT', visaCategory: 'Multiple entry', pax: 4, bulkProgress: null, travelDateStart: 'Jun 16', travelDateEnd: 'Jun 20', daysAway: 5, agency: 'Travergy Router', docStatus: 'pending', whatChanged: 'just-assigned', timeAgo: 'Just now', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-SGP-11815', country: 'Singapore', flag: '🇸🇬', visaType: 'POP', visaCategory: 'Single entry', pax: 2, bulkProgress: null, travelDateStart: 'Jul 04', travelDateEnd: 'Jul 11', daysAway: 22, agency: 'Happy Vacation', docStatus: 'not-yet', whatChanged: 'just-assigned', timeAgo: 'Just now', chatUnread: false, escalated: false, blocked: false, group: '' },
]

export const attentionOrders: Order[] = [
  { id: 'SMV-ZFA-00450', country: 'South Africa', flag: '🇿🇦', visaType: 'POP', visaCategory: 'Single entry', pax: 1, bulkProgress: null, travelDateStart: 'Jun 22', travelDateEnd: 'Jul 11', daysAway: 10, agency: 'Travelling Divas', docStatus: 'pending', whatChanged: 'escalated', timeAgo: '2h ago', chatUnread: true, escalated: true, blocked: false, group: 'escalated' },
]

export const progressOrders: Order[] = [
  { id: 'SMV-OMN-00494', country: 'Oman', flag: '🇴🇲', visaType: 'POP', visaCategory: 'Single entry', pax: 2, bulkProgress: null, travelDateStart: 'Jun 16', travelDateEnd: 'Jun 23', daysAway: 4, agency: 'Makemytrip', docStatus: 'uploaded', whatChanged: 'docs-uploaded', timeAgo: '1h ago', chatUnread: false, escalated: false, blocked: false, group: 'actionable' },
  { id: 'SMV-BHR-00160', country: 'Bahrain', flag: '🇧🇭', visaType: 'POP', visaCategory: 'Single entry', pax: 1, bulkProgress: null, travelDateStart: 'Jun 26', travelDateEnd: 'Jul 16', daysAway: 14, agency: 'Tripmee Travel', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '6h ago', chatUnread: false, escalated: false, blocked: false, group: 'actionable' },
  { id: 'SMV-IDN-12711', country: 'Indonesia', flag: '🇮🇩', visaType: 'POP', visaCategory: 'Single entry', pax: 44, bulkProgress: { done: 17, total: 44 }, travelDateStart: 'Jun 16', travelDateEnd: 'Jun 23', daysAway: 4, agency: 'Makemytrip', docStatus: 'uploaded', whatChanged: 'docs-uploaded', timeAgo: '30m ago', chatUnread: true, escalated: false, blocked: false, group: 'actionable' },
  { id: 'SMV-GEO-00563', country: 'Georgia', flag: '🇬🇪', visaType: 'POP', visaCategory: 'Multiple entry', pax: 5, bulkProgress: null, travelDateStart: 'Jul 25', travelDateEnd: 'Aug 02', daysAway: 43, agency: 'Triponomic', docStatus: 'pending', whatChanged: 'waiting-ta', timeAgo: '3h ago', chatUnread: false, escalated: false, blocked: true, group: 'waiting' },
  { id: 'SMV-CHE-00748', country: 'Switzerland', flag: '🇨🇭', visaType: 'POP', visaCategory: 'Multiple entry', pax: 2, bulkProgress: null, travelDateStart: 'Jul 15', travelDateEnd: 'Jul 27', daysAway: 33, agency: 'Dial and Travel', docStatus: 'pending', whatChanged: 'waiting-vendor', timeAgo: '5h ago', chatUnread: false, escalated: false, blocked: true, group: 'waiting' },
  { id: 'SMV-ISR-00008', country: 'Israel', flag: '🇮🇱', visaType: 'POP', visaCategory: 'Single entry', pax: 1, bulkProgress: null, travelDateStart: 'Jun 27', travelDateEnd: 'Jul 12', daysAway: 15, agency: 'Waymates Tour', docStatus: 'uploaded', whatChanged: 'docs-uploaded', timeAgo: '45m ago', chatUnread: false, escalated: false, blocked: false, group: 'actionable' },
  { id: 'SMV-USA-00101', country: 'USA', flag: '🇺🇸', visaType: 'POP', visaCategory: 'B1/B2', pax: 3, bulkProgress: null, travelDateStart: 'Jul 21', travelDateEnd: 'Aug 03', daysAway: 11, agency: 'Krishna Booking', docStatus: 'uploaded', whatChanged: 'waiting-vendor', timeAgo: '2h ago', chatUnread: false, escalated: false, blocked: true, group: 'waiting' },
]

export const submittedOrders: Order[] = [
  { id: 'SMV-VNM-15601', country: 'Vietnam', flag: '🇻🇳', visaType: 'POP', visaCategory: 'Single entry', pax: 2, bulkProgress: null, travelDateStart: 'Jun 20', travelDateEnd: 'Jul 05', daysAway: 23, agency: 'Oasis Traveller', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-VNM-15603', country: 'Vietnam', flag: '🇻🇳', visaType: 'POP', visaCategory: 'Single entry', pax: 3, bulkProgress: null, travelDateStart: 'Jun 22', travelDateEnd: 'Jul 08', daysAway: 26, agency: 'Horizon Tours', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-VNM-15605', country: 'Vietnam', flag: '🇻🇳', visaType: 'EXP', visaCategory: 'Single entry', pax: 1, bulkProgress: null, travelDateStart: 'Jun 14', travelDateEnd: 'Jun 19', daysAway: 3, agency: 'Waheguru Travels', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-ARE-09438', country: 'UAE', flag: '🇦🇪', visaType: 'POP', visaCategory: 'Multiple entry', pax: 2, bulkProgress: null, travelDateStart: 'Jul 10', travelDateEnd: 'Jul 20', daysAway: 28, agency: 'Triptopia India', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-TW-00004', country: 'Taiwan', flag: '🇹🇼', visaType: 'POP', visaCategory: 'Single entry', pax: 4, bulkProgress: null, travelDateStart: 'Jul 07', travelDateEnd: 'Jul 14', daysAway: 25, agency: 'Clarus Agencies', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '', chatUnread: false, escalated: false, blocked: false, group: '' },
  { id: 'SMV-CHN-00770', country: 'China', flag: '🇨🇳', visaType: 'POP', visaCategory: 'Single entry', pax: 1, bulkProgress: null, travelDateStart: 'Jul 20', travelDateEnd: 'Feb 07', daysAway: 38, agency: 'Oppdoor Innova', docStatus: 'uploaded', whatChanged: 'no-change', timeAgo: '', chatUnread: false, escalated: false, blocked: false, group: '' },
]
