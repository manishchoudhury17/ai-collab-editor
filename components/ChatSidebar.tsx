'use client';

import { useState, useRef } from 'react';
import { callAI } from '@/lib/ai';
import { nanoid } from 'nanoid';

export function ChatSidebar({ onApplyToEditor }:{ onApplyToEditor: (text: string)=>void }) {
  const [messages, setMessages] = useState<{id: string, role: 'user'|'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim()) return;
    const msg = { id: nanoid(), role: 'user' as const, content: input.trim() };
    const next = [...messages, msg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await callAI(next.map(m => ({ role: m.role, content: m.content })));
      const asst = { id: nanoid(), role: 'assistant' as const, content: res.text ?? 'No response' };
      setMessages([...next, asst]);
      setTimeout(() => viewportRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 10);
    } catch (e:any) {
      setMessages([...next, { id: nanoid(), role: 'assistant', content: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-[360px] border-l bg-gray-50 h-screen flex flex-col">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">AI Chat</h2>
        <p className="text-xs text-gray-500">Ask anything, or use /agent for web search.</p>
      </div>
      <div className="flex-1 overflow-auto px-3 py-3 space-y-3" ref={viewportRef}>
        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={"inline-block max-w-[85%] rounded-2xl px-3 py-2 whitespace-pre-wrap " + (m.role === 'user' ? 'bg-black text-white' : 'bg-white border')}>
              {m.content}
            </div>
            {m.role === 'assistant' && (
              <div className="mt-1 flex gap-2">
                <button className="text-xs px-2 py-1 border rounded hover:bg-gray-100" onClick={() => onApplyToEditor(m.content)}>Insert into editor</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Type a message or /agent find latest news on Next.js 15" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){send();}}} />
          <button className="px-3 py-2 rounded-lg bg-black text-white" onClick={send} disabled={loading}>{loading?'…':'Send'}</button>
        </div>
      </div>
    </aside>
  );
}
