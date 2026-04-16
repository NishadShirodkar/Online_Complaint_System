"use client";

import { useCallback, useEffect, useState, useRef } from "react";

type Complaint = {
  _id: string;
  text: string;
  category?: string;
  priority?: string;
  createdAt?: string;
  imageUrl?: string;
};

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-600 border border-red-100",
  Medium: "bg-amber-50 text-amber-600 border border-amber-100",
  Low: "bg-emerald-50 text-emerald-600 border border-emerald-100",
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

export default function Home() {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

      const formData = new FormData();
      formData.append("text", trimmedText);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit complaint.");
      }

      setText("");
      setImageFile(null);
      setMessageType("success");
      setMessage("Complaint submitted 🚀");
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

  // Camera Functions
  async function startCamera() {
    setIsCameraOpen(true);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setCameraError("Camera permission denied or device not found.");
      console.error("Camera access error:", error);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions identical to video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setImageFile(file);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f4f7ff] via-white to-[#f5efff] px-4 py-12 text-zinc-800 font-sans relative">
      
      {/* ─── CAMERA OVERLAY MODAL ─── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-slide-in">
            <h2 className="text-xl font-bold mb-4 text-zinc-800">📸 Take a Photo</h2>
            
            {cameraError ? (
              <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm font-medium mb-4 text-center">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition"
              >
                Cancel
              </button>
              {!cameraError && (
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] shadow-lg shadow-[#22c55e]/30 transition"
                >
                  Capture
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div className="mx-auto w-full max-w-4xl text-center mb-8">
        <h1 className="text-[2.5rem] leading-tight font-extrabold text-[#7c3aed] mb-2 tracking-tight">
          Smart Complaint System
        </h1>
        <p className="text-sm font-medium text-zinc-500">
          AI-powered complaint categorization & prioritization
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl mb-12">
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Describe your issue..."
                className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[140px] resize-y placeholder:text-zinc-400"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-zinc-600 font-medium">Upload Image</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer bg-[#6366f1] hover:bg-[#4f46e5] shadow-sm shadow-[#6366f1]/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition inline-flex items-center">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    disabled={isSubmitting}
                  />
                </label>
                
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isSubmitting}
                  className="bg-[#22c55e] hover:bg-[#16a34a] shadow-sm shadow-[#22c55e]/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition inline-flex items-center gap-1.5"
                >
                  📷 Camera
                </button>

                {imageFile && (
                  <div className="ml-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7c3aed] bg-[#f3e8ff] px-3 py-1.5 rounded-lg border border-[#e9d5ff]">
                      {imageFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="text-zinc-400 hover:text-red-500 transition text-xs font-bold"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {message ? (
              <div
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  messageType === "success"
                    ? "bg-[#d1fae5] text-[#065f46]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold tracking-wide rounded-2xl py-4 transition shadow-lg shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 transition hover:text-[#7c3aed]"
            >
              🛡️ Go to Admin Dashboard →
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-800">
            Complaints
          </h2>
          <button
            type="button"
            onClick={() => void loadComplaints()}
            disabled={isLoadingComplaints}
            className="rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700 shadow-sm disabled:opacity-60"
          >
            {isLoadingComplaints ? "..." : "Refresh"}
          </button>
        </div>

        {isLoadingComplaints ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/50 px-4 py-12 text-center text-sm font-bold text-zinc-400">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/50 px-4 py-12 text-center text-sm font-bold text-zinc-400">
            No complaints found
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <article
                key={complaint._id}
                className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-center flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${
                      CATEGORY_STYLES[complaint.category || "General"] ||
                      CATEGORY_STYLES.General
                    }`}
                  >
                    {complaint.category || "General"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${
                      PRIORITY_STYLES[complaint.priority || "Low"] ||
                      PRIORITY_STYLES.Low
                    }`}
                  >
                    {complaint.priority || "Low"}
                  </span>
                  <span className="ml-1 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                    {complaint.createdAt
                      ? new Date(complaint.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                        })
                      : "Unknown date"}
                  </span>
                </div>
                
                <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-zinc-700">
                  {complaint.text}
                </p>

                {complaint.imageUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100 w-32 h-24 shrink-0 shadow-sm relative group">
                    <img
                      src={complaint.imageUrl}
                      alt="attachment"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <a href={complaint.imageUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="bg-white px-2 py-1 rounded shadow-sm text-[10px] font-bold text-zinc-800">View</span>
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
