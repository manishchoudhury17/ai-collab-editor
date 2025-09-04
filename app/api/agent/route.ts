import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

async function tavilySearch(query: string) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error('Missing TAVILY_API_KEY');
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, query, max_results: 5, search_depth: 'advanced' })
  });
  if (!res.ok) throw new Error('Tavily error: ' + await res.text());
  return res.json();
}

async function fetchText(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Agent Demo)' } });
    if (!res.ok) return '';
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text.slice(0, 20000);
  } catch {
    return '';
  }
}

async function summarize(text: string, query: string) {
  const provider = process.env.OPENAI_API_KEY ? 'openai' : (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'none');
  if (provider === 'none') return `Agent offline (no AI key). Found text of length ${text.length}.`;

  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const messages = [
    { role: 'system', content: 'Summarize crisply with bullet points and include key facts, dates, and links if provided. Keep under 150 words.' },
    { role: 'user', content: `Query: ${query}\nText: ${text.slice(0, 16000)}`}
  ];
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, messages, temperature: 0.2 })
    });
    if (!res.ok) throw new Error('OpenAI summarize error: ' + await res.text());
    const j = await res.json();
    return j.choices?.[0]?.message?.content || '';
  } else {
    const res = await fetch(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model, messages, temperature: 0.2 })
    });
    if (!res.ok) throw new Error('OpenRouter summarize error: ' + await res.text());
    const j = await res.json();
    return j.choices?.[0]?.message?.content || '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    const search = await tavilySearch(query);
    const top = search.results?.slice(0, 3) || [];
    let combined = '';
    for (const r of top) {
      const t = await fetchText(r.url);
      combined += `\nSOURCE: ${r.url}\n${t}\n`;
    }
    const summary = await summarize(combined, query);
    return NextResponse.json({ summary });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
