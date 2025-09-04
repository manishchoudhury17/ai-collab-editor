'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatSidebar } from '@/components/ChatSidebar';
import { callAIEdit } from '@/lib/ai';
import { AIPreviewModal } from '@/components/AIPreviewModal';
import { AgentControls } from '@/components/AgentControls';
import { nanoid } from 'nanoid';

// Dynamic import the Editor because it uses browser-only APIs (WebRTC / Yjs)
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

export default function Page() {
  const [roomId, setRoomId] = useState<string>('demo-room');
  const [selection, setSelection] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{original: string, suggestion: string} | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Generate a persistent room id from URL hash or create one
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const r = url.searchParams.get('room');
      if (r) setRoomId(r);
      else {
        const newId = 'room-' + nanoid(8);
        url.searchParams.set('room', newId);
        window.history.replaceState({}, '', url.toString());
        setRoomId(newId);
      }
    }
  }, []);

  const onAIAction = async (mode: string, selectedText: string, instruction?: string) => {
    const original = selectedText;
    try {
      const { suggestion } = await callAIEdit({ mode, selection: original, instruction });
      setModalData({ original, suggestion });
      setModalOpen(true);
    } catch (e) {
      alert('AI edit failed: ' + (e as Error).message);
    }
  };

  const applySuggestion = () => {
    if (modalData && editorRef.current) {
      editorRef.current.replaceSelection(modalData.suggestion);
      setModalOpen(false);
      setModalData(null);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h1 className="text-lg font-semibold">AI Collab Editor</h1>
          <div className="flex items-center gap-3">
            <AgentControls onInsert={(text) => editorRef.current?.insertAtCursor(text)} />
            <span className="text-xs text-gray-500">Room: {roomId}</span>
          </div>
        </div>
        <Editor roomId={roomId} onSelectionText={setSelection} onAIAction={onAIAction} ref={editorRef} />
      </div>
      <ChatSidebar onApplyToEditor={(text) => editorRef.current?.insertAtCursor(text)} />
      <AIPreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        original={modalData?.original ?? ''}
        suggestion={modalData?.suggestion ?? ''}
        onConfirm={applySuggestion}
      />
    </div>
  );
}
