export type AISuggestionItem = {
  name: string;
  qty: number;
};

export type AISuggestion = {
  severity: number; // 0..1
  categories: string[];
  items: AISuggestionItem[];
  confidence: number; // 0..1
};

export type AnalyzePinInput = {
  description: string;
  imageBase64?: string; // optional inline image data (base64, no prefix)
  imageMime?: string;   // e.g., image/jpeg, image/png
  allowedItems?: string[]; // limit item names to this list
};
