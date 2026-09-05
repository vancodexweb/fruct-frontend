export type ScriptCategory =
  | "GREETING"
  | "PRICE"
  | "DELIVERY"
  | "WARRANTY"
  | "OBJECTION"
  | "CLOSING"
  | "OTHER";

export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  "GREETING",
  "PRICE",
  "DELIVERY",
  "WARRANTY",
  "OBJECTION",
  "CLOSING",
  "OTHER",
];

export interface Script {
  id: string;
  category: ScriptCategory;
  title: string;
  content: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
}

export interface CreateScriptDto {
  category: ScriptCategory;
  title: string;
  content: string;
}

export interface UpdateScriptDto {
  category?: ScriptCategory;
  title?: string;
  content?: string;
}

/** Fixed placeholder set: {{name}}, {{price}}, {{city}}, {{deliveryDays}}. */
export interface RenderScriptDto {
  name?: string;
  price?: number;
  city?: string;
  deliveryDays?: number;
}
