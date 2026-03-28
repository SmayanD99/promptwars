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
  summary: string;
  category: string;
  severity: SeverityLevel;
  actions: ActionItem[];
  locations: LocationMarker[];
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
