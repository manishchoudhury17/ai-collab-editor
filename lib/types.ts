export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string; id: string };
export type AIEditRequest = {
  mode: 'rewrite' | 'shorten' | 'lengthen' | 'grammar' | 'table' | 'custom';
  selection: string;
  instruction?: string;
};
export type AIEditResponse = { suggestion: string };
