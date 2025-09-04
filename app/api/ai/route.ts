import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';

function sysPrompt() {
  return `You are an assistant for a collaborative editor. If you are asked to edit a selection, return ONLY the edited text without extra commentary.`;
}

async function callOpenAI(messages: any[], model: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY');
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('OpenAI error: ' + t);
  }
  const j = await res.json();
  return j.choices?.[0]?.message?.content || '';
}

async function callOpenRouter(messages: any[], model: string) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('Missing OPENROUTER_API_KEY');
  const res = await fetch(OPENROUTER_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });
  if (!res.ok) throw new Error('OpenRouter error: ' + await res.text());
  const j = await res.json();
  return j.choices?.[0]?.message?.content || '';
}

// Simple route that supports two modes: chat and edit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    if (body.edit) {
      const { mode, selection, instruction } = body.edit as { mode: string, selection: string, instruction?: string };
      const task = mode === 'grammar' ? 'Fix grammar & clarity' :
                   mode === 'shorten' ? 'Shorten without losing meaning' :
                   mode === 'lengthen' ? 'Expand with detail, keep tone' :
                   mode === 'rewrite' ? 'Rewrite for better style' :
                   mode === 'table' ? 'Convert to a concise Markdown table' : (instruction || 'Improve');
      const messages = [
        { role: 'system', content: sysPrompt() },
        { role: 'user', content: `${task}:
---
${selection}
---
Reply with ONLY the edited text.`}
      ];
      const provider = process.env.OPENAI_API_KEY ? 'openai' : (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'none');
      if (provider === 'none') return NextResponse.json({ suggestion: selection }, { status: 200 }); // no key: echo
      const text = provider === 'openai' ? await callOpenAI(messages, model) : await callOpenRouter(messages, model);
      return NextResponse.json({ suggestion: text });
    }

    // Chat mode
    const { messages } = body as { messages: { role: string, content: string }[] };
    const provider = process.env.OPENAI_API_KEY ? 'openai' : (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'none');
    if (provider === 'none') {
      return NextResponse.json({ text: 'No AI key configured. Provide OPENAI_API_KEY or OPENROUTER_API_KEY to enable AI.' });
    }
    const msgs = [{ role: 'system', content: sysPrompt() }, ...messages];
    const text = provider === 'openai' ? await callOpenAI(msgs, model) : await callOpenRouter(msgs, model);
    return NextResponse.json({ text });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
