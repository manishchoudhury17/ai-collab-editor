'use client';

import { useState } from 'react';
import { callAgent } from '@/lib/ai';

export function AgentControls({ onInsert }:{ onInsert: (text:string)=>void }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string | null>(null);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await callAgent(q.trim());
      setOut(res.summary || JSON.stringify(res, null, 2));
    } catch (e:any) {
      setOut('Agent error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input className="border rounded px-2 py-1 text-sm w-72" placeholder="Agent search (e.g., latest Next.js 15)" value={q} onChange={e=>setQ(e.target.value)} />
      <button className="text-sm px-2 py-1 rounded bg-white border hover:bg-gray-50" onClick={run} disabled={loading}>{loading?'Searching…':'Run Agent'}</button>
      {out && <button className="text-sm px-2 py-1 rounded bg-black text-white" onClick={()=> onInsert(out)}>Insert</button>}
    </div>
  );
}
