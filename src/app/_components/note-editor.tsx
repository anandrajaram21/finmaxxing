"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

export function NoteEditor() {
  const utils = api.useUtils();
  const [content, setContent] = useState("");
  const notes = api.note.list.useQuery();
  const createNote = api.note.create.useMutation({
    onSuccess: async () => {
      setContent("");
      await utils.note.list.invalidate();
    },
  });

  return (
    <section className="flex w-full max-w-2xl flex-col gap-5">
      <form
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          createNote.mutate({ content });
        }}
      >
        <label htmlFor="note" className="text-sm font-medium text-slate-700">
          New note
        </label>
        <textarea
          id="note"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a note..."
          rows={5}
          maxLength={2000}
          className="min-h-32 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{content.length}/2000</span>
          <button
            type="submit"
            disabled={!content.trim() || createNote.isPending}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {createNote.isPending ? "Saving..." : "Save note"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-950">Your notes</h2>
        {notes.isLoading ? (
          <p className="text-sm text-slate-500">Loading notes...</p>
        ) : notes.data?.length ? (
          <ul className="flex flex-col gap-3">
            {notes.data.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 shadow-sm"
              >
                <p className="whitespace-pre-wrap">{note.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No notes yet.
          </p>
        )}
      </div>
    </section>
  );
}
