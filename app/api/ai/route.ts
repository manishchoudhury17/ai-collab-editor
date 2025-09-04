// app/api/ai/route.ts
import type { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';

type EditMode = 'grammar' | 'shorten' | 'lengthen' | 'rewrite' | 'table';

function buildSystemPrompt(mode: EditMode) {
  switch (mode) {
    case 'grammar':  return 'You improve clarity and fix grammar without changing meaning.';
    case 'shorten':  return 'You shorten the text while preserving core meaning.';
    case 'lengthen': return 'You expand the text with concise, relevant detail.';
    case 'rewrite':  return 'You rewrite clearly and professionally.';
    case 'table':    return 'Convert the selection into a concise Markdown table (no extra commentary).';
    default:         return 'You are a helpful editing assistant.';
  }
}

async function callChatCompletions(baseUrl: string, apiKey: string, model: string, system: string, user: string) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // OpenRouter recommends these; harmless for OpenAI:
      'HTTP-Referer': 'https://ai-collab-editor.vercel.app',
      Referer: 'https://ai-collab-editor.vercel.app',
      'X-Title': 'AI Collab Editor Demo',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const body = contentType.includes('application/json')
      ? JSON.stringify(await res.json())
      : await res.text();
    throw new Error(`Upstream error ${res.status}: ${body.slice(0, 300)}`);
  }

  if (contentType.includes('application/json')) {
    const data = await res.json();
    const msg = data?.choices?.[0]?.message?.content;
    if (!msg) throw new Error('No content returned from model');
    return msg as string;
  } else {
    const text = await res.text();
    throw new Error(`Upstream returned non-JSON (${contentType}): ${text.slice(0, 300)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mode, selection } = await req.json() as { mode: EditMode; selection: string };
    if (!selection) return new Response(JSON.stringify({ error: 'No selection provided' }), { status: 400 });

    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const orKey = process.env.OPENROUTER_API_KEY?.trim();
    const orBase = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').trim();
    const model = (process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct:free').trim();

    // Accept both OpenRouter key styles:
    const isOpenRouterKey =
      !!orKey && (orKey.startsWith('outr_') || orKey.startsWith('sk-or-') || orKey.startsWith('sk-openrouter-'));

    let suggestion = '';
    if (openaiKey?.startsWith('sk-') && !isOpenRouterKey) {
      // Real OpenAI key -> use api.openai.com
      suggestion = await callChatCompletions('https://api.openai.com/v1', openaiKey, model, buildSystemPrompt(mode), selection);
    } else if (isOpenRouterKey) {
      // OpenRouter key -> use OpenRouter base URL
      suggestion = await callChatCompletions(orBase, orKey!, model, buildSystemPrompt(mode), selection);
    } else {
      return new Response(
        JSON.stringify({ error: 'No AI key configured. Set OPENROUTER_API_KEY (sk-or… / outr_…) or OPENAI_API_KEY (sk-…).' }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
