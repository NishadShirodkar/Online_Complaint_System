"use client";

import { useCallback, useEffect, useState } from "react";

type Complaint = {
  _id: string;
  text: string;
  imageUrl?: string;
  category?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
};

type GroupedComplaints = {
  [category: string]: Complaint[];
};

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-600 border border-red-100",
  Medium: "bg-amber-50 text-amber-600 border border-amber-100",
  Low: "bg-emerald-50 text-emerald-600 border border-emerald-100",
};

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  "In Progress": "bg-blue-50 text-blue-600 border border-blue-100",
  Resolved: "bg-emerald-50 text-emerald-600 border border-emerald-100",
};

const CATEGORY_STYLES: Record<string, string> = {
  Infrastructure: "bg-indigo-50 text-indigo-600 border border-indigo-100",
  Cleanliness: "bg-cyan-50 text-cyan-600 border border-cyan-100",
  Food: "bg-orange-50 text-orange-600 border border-orange-100",
  Hostel: "bg-pink-50 text-pink-600 border border-pink-100",
  Academic: "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100",
  Other: "bg-blue-50 text-blue-600 border border-blue-100",
  General: "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

const CATEGORY_ICONS: Record<string, string> = {
  Infrastructure: "🏗️",
  Cleanliness: "🧹",
  Food: "🍽️",
  Hostel: "🏠",
  Academic: "📚",
  Other: "📋",
  General: "📋",
};

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const loadComplaints = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/complaints");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load complaints.");
      }

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to load complaints.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedComplaint(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      setUpdatingId(id);
      const response = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update complaint.");
      }

      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
      );
      
      if (selectedComplaint && selectedComplaint._id === id) {
        setSelectedComplaint((prev) => prev ? { ...prev, status: newStatus } : null);
      }

      showToast(`Status updated to "${newStatus}"`, "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to update complaint.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this complaint?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/complaints/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Unable to delete complaint.");
      }

      setComplaints((prev) => prev.filter((c) => c._id !== id));
      
      if (selectedComplaint && selectedComplaint._id === id) {
        setSelectedComplaint(null);
      }

      showToast("Complaint deleted successfully.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to delete complaint.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const highPriorityComplaints = filteredComplaints.filter(
    (c) => c.priority === "High"
  );

  const nonHighPriority = filteredComplaints.filter(
    (c) => c.priority !== "High"
  );
  
  const groupedByCategory: GroupedComplaints = nonHighPriority.reduce(
    (acc, complaint) => {
      const key = complaint.category || "General";
      if (!acc[key]) acc[key] = [];
      acc[key].push(complaint);
      return acc;
    },
    {} as GroupedComplaints
  );

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "Pending" || !c.status).length;
  const inProgressCount = complaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const highCount = complaints.filter((c) => c.priority === "High").length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f4f7ff] via-white to-[#f5efff] text-zinc-800 font-sans pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-bold shadow-xl backdrop-blur-sm transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "border-[#34d399]/40 bg-[#d1fae5] text-[#065f46]"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modal Overlay */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6" onClick={() => setSelectedComplaint(null)}>
          <div 
            className="animate-slide-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/90 px-6 py-4 backdrop-blur-md">
              <h2 className="text-lg font-bold text-zinc-800">Complaint Details</h2>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="flex h-8 w-8  items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${PRIORITY_STYLES[selectedComplaint.priority || "Low"]}`}>
                  {selectedComplaint.priority === "High" && "🔥 "}{selectedComplaint.priority || "Low"}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[selectedComplaint.status || "Pending"]}`}>
                  {selectedComplaint.status === "Resolved" && "✓ "}
                  {selectedComplaint.status || "Pending"}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_STYLES[selectedComplaint.category || "General"]}`}>
                  {CATEGORY_ICONS[selectedComplaint.category || "General"]} {selectedComplaint.category || "General"}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Description</h3>
                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">{selectedComplaint.text}</p>
              </div>

              {selectedComplaint.imageUrl && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Attachment</h3>
                  <a href={selectedComplaint.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-zinc-200 group relative shadow-sm">
                    <img src={selectedComplaint.imageUrl} alt="Attachment" className="w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-white/50 opacity-0 transition group-hover:opacity-100 flex items-center justify-center">
                      <span className="bg-white/90 shadow-md text-zinc-800 rounded-lg px-4 py-2 font-bold text-sm">Open in new tab</span>
                    </div>
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Submitted on</p>
                  <p className="text-sm font-semibold text-zinc-600 mt-1">
                    {selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : "Unknown date"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedComplaint.status || "Pending"}
                    onChange={(e) => void handleStatusChange(selectedComplaint._id, e.target.value)}
                    disabled={updatingId === selectedComplaint._id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:bg-zinc-100 cursor-pointer"
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="In Progress">🔧 In Progress</option>
                    <option value="Resolved">✅ Resolved</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleDelete(selectedComplaint._id)}
                    disabled={deletingId === selectedComplaint._id}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] text-white shadow-md shadow-purple-500/20">
                🛡️
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-[#7c3aed]">
                  Complaint Manager
                </h1>
                <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                  Admin Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-xs font-bold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700 shadow-sm"
              >
                ← Back to Submit
              </a>
              <button
                type="button"
                onClick={() => void loadComplaints()}
                disabled={isLoading}
                className="rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Refreshing…" : "⟳ Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Total</p>
            <p className="mt-2 text-3xl font-extrabold text-zinc-800">{totalComplaints}</p>
          </div>
          <div className="rounded-3xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">High Priority</p>
            <p className="mt-2 text-3xl font-extrabold text-red-600">{highCount}</p>
          </div>
          <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Pending</p>
            <p className="mt-2 text-3xl font-extrabold text-zinc-600">{pendingCount}</p>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">In Progress</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">{inProgressCount}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Resolved</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{resolvedCount}</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints by text or category…"
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-10 pr-4 text-sm text-zinc-800 font-medium outline-none placeholder:text-zinc-400 placeholder:font-normal transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm"
            />
          </div>
          <div className="flex gap-2 p-1 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            {["All", "Pending", "In Progress", "Resolved"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  filterStatus === status
                    ? "bg-[#f3e8ff] text-[#7c3aed]"
                    : "bg-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#7c3aed]"></div>
            <p className="mt-4 text-sm font-bold text-zinc-400">
              Loading complaints…
            </p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/50 py-24">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-sm font-bold text-zinc-400">No complaints found</p>
          </div>
        ) : (
          <>
            {/* ─── HIGH PRIORITY SECTION ─── */}
            {highPriorityComplaints.length > 0 && (
              <section className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-lg shadow-sm">
                    🔴
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-zinc-800">
                      High Priority
                    </h2>
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-0.5">
                      Urgent Attention Required
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {highPriorityComplaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint._id}
                      complaint={complaint}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      updatingId={updatingId}
                      deletingId={deletingId}
                      isHighPriority
                      onClick={() => setSelectedComplaint(complaint)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ─── CATEGORY SECTIONS ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {Object.entries(groupedByCategory)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, items]) => (
                  <section key={category} className="mb-10 w-full min-w-0">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-zinc-100 shadow-sm text-lg">
                        {CATEGORY_ICONS[category] || "📋"}
                      </span>
                      <div>
                        <h2 className="text-lg font-extrabold text-zinc-800 truncate">
                          {category}
                        </h2>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                          {items.length} complaint{items.length !== 1 && "s"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {items.map((complaint) => (
                        <ComplaintCard
                          key={complaint._id}
                          complaint={complaint}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                          updatingId={updatingId}
                          deletingId={deletingId}
                          onClick={() => setSelectedComplaint(complaint)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/* ─── Complaint Card Component ─── */
function ComplaintCard({
  complaint,
  onStatusChange,
  onDelete,
  updatingId,
  deletingId,
  isHighPriority = false,
  onClick,
}: {
  complaint: Complaint;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  updatingId: string | null;
  deletingId: string | null;
  isHighPriority?: boolean;
  onClick: () => void;
}) {
  const priority = complaint.priority || "Low";
  const status = complaint.status || "Pending";
  const category = complaint.category || "General";
  
  const isUpdating = updatingId === complaint._id;
  const isDeleting = deletingId === complaint._id;

  return (
    <article
      onClick={onClick}
      className={`group relative rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer bg-white ${
        isHighPriority
          ? `border-red-200 shadow-red-500/5`
          : "border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
      }`}
    >
      {/* High Priority Indicator ring */}
      {isHighPriority && (
        <div className="absolute -inset-px rounded-3xl border-2 border-red-400 opacity-20 pointer-events-none"></div>
      )}

      <div className="flex flex-col gap-3">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low}`}>
            {priority === "High" && "🔥 "}{priority}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[status] || STATUS_STYLES.Pending}`}>
            {status === "Resolved" && "✓ "}{status}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${CATEGORY_STYLES[category] || CATEGORY_STYLES.General}`}>
            {category}
          </span>
        </div>

        {/* Text Body */}
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed line-clamp-3 text-zinc-700 font-medium">
          {complaint.text}
        </p>

        {/* Thumbnail Preview */}
        {complaint.imageUrl && (
          <div className="mt-1 h-24 w-36 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
            <img src={complaint.imageUrl} alt="preview" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-4">
          <span className="text-[10px] font-bold text-zinc-400">
            {complaint.createdAt
              ? new Date(complaint.createdAt).toLocaleDateString()
              : "Unknown date"}
          </span>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={status}
              onChange={(e) => void onStatusChange(complaint._id, e.target.value)}
              disabled={isUpdating}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 outline-none transition focus:border-purple-500 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer appearance-none"
            >
              <option value="Pending">⏳ Pending</option>
              <option value="In Progress">🔧 In Prog.</option>
              <option value="Resolved">✅ Resolved</option>
            </select>
            <button
              type="button"
              onClick={() => void onDelete(complaint._id)}
              disabled={isDeleting}
              className="rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition disabled:opacity-50"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
