export interface AccountContact {
  id: string;
  name: string;
  targetRole: string;
  tier: string;
  relationshipStatus: string;
  nextStep: string;
  nextFollowUpDate: string | null;
  email: string;
  isClosed: boolean;
  companyId: string;
}

// ERD: FOLLOW_UP (id, contact_id, last_contacted_date, period, due_date,
// description_remark, owner_id, action). period and descriptionRemark are
// optional so existing seed rows stay valid.
export interface AccountFollowUp {
  id: string;
  contactId: string;
  dueDate: string; // YYYY-MM-DD
  lastContactedDate: string | null; // YYYY-MM-DD; null until the first contact is logged
  action: string;
  ownerId: string;
  period?: number | null; // days between contacts (DL-13)
  descriptionRemark?: string | null;
}
