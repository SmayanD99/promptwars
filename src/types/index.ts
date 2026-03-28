export type InputType = 'text' | 'image' | 'voice' | 'url' | 'file';

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ActionType =
  | 'call'
  | 'navigate'
  | 'checklist'
  | 'link'
  | 'download'
  | 'info'
  | 'warning';

export interface ActionItem {
  title: string;
  description: string;
  priority: ActionPriority;
  type: ActionType;
  url?: string;
  phone?: string;
  steps?: string[];
}

export interface LocationMarker {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  address?: string;
}

/** Service provider entry for the Action Table */
export interface ServiceProvider {
  name: string;
  specialty: string;
  eta: string;
  contact: string;
  verificationStatus: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

/** Handover Card entity data for responders */
export interface HandoverCard {
  emergencyType: string;
  detectedLanguage: string;
  translatedSummary: string;
  entityData: Record<string, string>;
  timestamp: string;
}

export interface BridgeInput {
  text?: string;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  language?: string;
  latitude?: number;
  longitude?: number;
}

export interface BridgeOutput {
  status: string;
  immediateInstruction: string;
  summary: string;
  category: string;
  severity: SeverityLevel;
  actions: ActionItem[];
  serviceProviders: ServiceProvider[];
  locations: LocationMarker[];
  handoverCard: HandoverCard;
  warnings: string[];
  keyFacts: string[];
  sourceVerification: string;
  timestamp: string;
}

export interface BridgeState {
  isLoading: boolean;
  error: string | null;
  result: BridgeOutput | null;
  streamedText: string;
}
