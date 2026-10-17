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

export interface AccountFollowUp {
  id: string;
  contactId: string;
  dueDate: string; // YYYY-MM-DD
  lastContactedDate: string; // YYYY-MM-DD
  action: string;
  ownerId: string;
}
