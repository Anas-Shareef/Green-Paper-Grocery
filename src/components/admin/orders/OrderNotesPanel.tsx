'use client'

import React, { useState, useTransition } from 'react'
import { addOrderNoteAction } from '@/app/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Loader2, Lock } from 'lucide-react'
import type { OrderNote } from '@/types/database.types'

interface OrderNotesPanelProps {
  orderId: string
  notes: (OrderNote & {
    author?: { id: string; full_name: string } | null
  })[]
}

export function OrderNotesPanel({ orderId, notes }: OrderNotesPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setErrorMsg(null)
    startTransition(async () => {
      const res = await addOrderNoteAction({
        orderId,
        note: newNote.trim(),
        visibility: 'internal',
      })

      if (res.success) {
        setNewNote('')
      } else {
        setErrorMsg(res.error || 'Failed to add note')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
        <MessageSquare className="h-4 w-4 text-emerald-600" />
        <span>Internal Operational Notes (Staff Only)</span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Add note input */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <div className="relative">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add internal note for store staff or delivery team..."
            rows={2}
            className="w-full p-2.5 pr-10 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !newNote.trim()}
            className="absolute right-2 bottom-2.5 h-7 w-7 p-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No internal notes recorded yet.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  {note.author?.full_name || 'Staff Member'}
                </span>
                <span className="font-mono">
                  {new Date(note.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {note.note}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
