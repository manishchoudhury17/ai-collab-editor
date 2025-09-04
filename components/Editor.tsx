'use client';

import React, {
  forwardRef, useEffect, useImperativeHandle, useRef, useState
} from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';

type Props = {
  roomId: string;
  onSelectionText: (text: string) => void;
  onAIAction: (mode: string, selectedText: string, instruction?: string) => void;
};

export type EditorHandle = {
  insertAtCursor: (text: string) => void;
  replaceSelection: (text: string) => void;
};

function randomName() {
  const animals = ['Lion','Panda','Koala','Tiger','Crane','Falcon','Otter','Hare','Yak','Gator'];
  return animals[Math.floor(Math.random()*animals.length)] + '-' + Math.floor(Math.random()*100);
}

const Editor = forwardRef<EditorHandle, Props>(({ roomId, onSelectionText, onAIAction }, ref) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const [ready, setReady] = useState(false);
  const [user] = useState(() => ({
    name: randomName(),
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
  }));

  // Create/destroy Y.Doc + Provider ONCE per roomId
  useEffect(() => {
    // hard cleanup if hot-reloaded
    providerRef.current?.destroy();
    ydocRef.current?.destroy();
    providerRef.current = null;
    ydocRef.current = null;

    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(roomId, ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;
    setReady(true);

    return () => {
      // clean shutdown
      try { providerRef.current?.destroy(); } catch {}
      try { ydocRef.current?.destroy(); } catch {}
      providerRef.current = null;
      ydocRef.current = null;
      setReady(false);
    };
  }, [roomId]);

  // Build the editor only AFTER provider/doc are ready
  // Build the editor. Always pass an options object; add collab bits only when ready.
const editor = useEditor(
  {
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing with your teammate...' }),
      CharacterCount.configure({ limit: 20000 }),

      // Add collaboration only when Y.Doc / provider are ready
      ...(ydocRef.current
        ? [Collaboration.configure({ document: ydocRef.current })]
        : []),

      ...(providerRef.current
        ? [CollaborationCursor.configure({
            provider: providerRef.current,
            user: { name: user.name, color: user.color },
          })]
        : []),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose max-w-none min-h-[calc(100vh-56px)] p-6 focus:outline-none',
      },
    },
    onSelectionUpdate({ editor }) {
      const text = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        ' ',
      );
      onSelectionText(text);
    },
  },
  // Recreate editor when room or readiness changes
  [roomId, ready],
);


  useImperativeHandle(ref, () => ({
    insertAtCursor(text: string) {
      if (!editor) return;
      editor.commands.insertContent(text);
    },
    replaceSelection(text: string) {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      editor.commands.insertContentAt({ from, to }, text);
    },
  }), [editor]);

  if (!editor) return <div className="flex-1" />;

  const selectionText = () =>
    editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');

  return (
    <div className="flex-1 relative bg-white">
      <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
        <div className="flex items-center gap-1 bg-black/90 text-white rounded-xl px-2 py-1 text-xs">
          <button className="px-2 py-1 hover:bg-white/10 rounded" onClick={() => onAIAction('grammar', selectionText())}>Fix</button>
          <button className="px-2 py-1 hover:bg-white/10 rounded" onClick={() => onAIAction('shorten', selectionText())}>Shorten</button>
          <button className="px-2 py-1 hover:bg-white/10 rounded" onClick={() => onAIAction('lengthen', selectionText())}>Lengthen</button>
          <button className="px-2 py-1 hover:bg-white/10 rounded" onClick={() => onAIAction('rewrite', selectionText())}>Rewrite</button>
          <button className="px-2 py-1 hover:bg-white/10 rounded" onClick={() => onAIAction('table', selectionText())}>To Table</button>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
});

Editor.displayName = 'Editor';
export default Editor;
