"use client";

import { useCallback, useEffect, useState } from "react";

type Complaint = {
  _id: string;
  text: string;
  category?: string;
  priority?: string;
  createdAt?: string;
};

export default function Home() {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );

  const loadComplaints = useCallback(async () => {
    try {
      setIsLoadingComplaints(true);

      const response = await fetch("/api/complaints");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load complaints.");
      }

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to load complaints."
      );
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText) {
      setMessageType("error");
      setMessage("Please enter a complaint before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      setMessageType("");

      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: trimmedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit complaint.");
      }

      setText("");
      setMessageType("success");
      setMessage("Complaint submitted successfully.");
      await loadComplaints();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to submit complaint."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Online Complaint Management System
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Submit a complaint
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Send a complaint to the backend and store it in MongoDB.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="complaint" className="text-sm font-medium text-zinc-700">
              Complaint text
            </label>
            <textarea
              id="complaint"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Describe the issue you want to report..."
              className="min-h-40 w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
              disabled={isSubmitting}
            />
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit complaint"}
          </button>
        </form>

        <section className="mt-10 border-t border-zinc-200 pt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Complaints
              </h2>
              <p className="text-sm text-zinc-600">
                Latest complaints appear here automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadComplaints()}
              disabled={isLoadingComplaints}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingComplaints ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoadingComplaints ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-sm text-zinc-500">
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-sm text-zinc-500">
              No complaints yet
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <article
                  key={complaint._id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-zinc-700">
                      {complaint.category || "General"}
                    </span>
                    <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-zinc-700">
                      {complaint.priority || "Low"}
                    </span>
                    <span>
                      {complaint.createdAt
                        ? new Date(complaint.createdAt).toLocaleString()
                        : "Unknown date"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                    {complaint.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
