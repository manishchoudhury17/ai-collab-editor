export async function callAI(messages: {role: string, content: string}[], signal?: AbortSignal) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal
  });
  if (!res.ok) throw new Error('AI request failed');
  return res.json();
}

export async function callAIEdit(payload: { mode: string, selection: string, instruction?: string }, signal?: AbortSignal) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edit: payload }),
    signal
  });
  if (!res.ok) throw new Error('AI edit failed');
  return res.json();
}

export async function callAgent(query: string, signal?: AbortSignal) {
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal
  });
  if (!res.ok) throw new Error('Agent failed');
  return res.json();
}
