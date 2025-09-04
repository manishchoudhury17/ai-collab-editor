'use client';

import React from 'react';

export function AIPreviewModal({ open, onClose, original, suggestion, onConfirm }:
  { open: boolean, onClose: () => void, original: string, suggestion: string, onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">AI Suggestion</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 max-h-[60vh] overflow-auto">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Original</div>
            <div className="p-3 rounded-lg bg-gray-50 whitespace-pre-wrap">{original || <em className="text-gray-400">No selection</em>}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Suggestion</div>
            <div className="p-3 rounded-lg bg-green-50 whitespace-pre-wrap">{suggestion}</div>
          </div>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800" onClick={onConfirm}>Confirm & Replace</button>
        </div>
      </div>
    </div>
  );
}
