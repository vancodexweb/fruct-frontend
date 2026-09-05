import type { ListQuery } from "./common";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_DIALOGUE"
  | "PROPOSAL_SENT"
  | "WAITING_DECISION"
  | "WON"
  | "LOST";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_DIALOGUE",
  "PROPOSAL_SENT",
  "WAITING_DECISION",
  "WON",
  "LOST",
];

export type LeadSource = "AVITO" | "YOUDO" | "WEBSITE" | "REFERRAL" | "OTHER";

export const LEAD_SOURCES: LeadSource[] = ["AVITO", "YOUDO", "WEBSITE", "REFERRAL", "OTHER"];

export type BuyerType = "INDIVIDUAL" | "LEGAL_ENTITY";

export interface Lead {
  id: string;
  assignedManagerId: string | null;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  source: LeadSource;
  sourceLink: string | null;
  status: LeadStatus;
  notes: string | null;
  buyerType: BuyerType;
  companyName: string | null;
  inn: string | null;
  firstResponseAt: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
}

export interface CreateLeadDto {
  fullName?: string;
  phone?: string;
  city?: string;
  source?: LeadSource;
  sourceLink?: string;
  notes?: string;
  buyerType?: BuyerType;
  companyName?: string;
  inn?: string;
  nextFollowUpAt?: string;
}

/** Excludes status (PATCH /leads/:id/status) and assignedManagerId (PATCH /leads/:id/assign, OWNER-only). */
export interface UpdateLeadDto {
  fullName?: string;
  phone?: string;
  city?: string;
  sourceLink?: string;
  notes?: string;
  buyerType?: BuyerType;
  companyName?: string;
  inn?: string;
  nextFollowUpAt?: string;
}

export interface ChangeLeadStatusDto {
  status: LeadStatus;
}

export interface AssignLeadDto {
  managerId: string;
}

export interface ListLeadsQuery extends ListQuery {
  status?: LeadStatus;
  source?: LeadSource;
  /** Only meaningful for OWNER — MANAGER is always scoped server-side to their own leads. */
  assignedManagerId?: string;
  search?: string;
}
