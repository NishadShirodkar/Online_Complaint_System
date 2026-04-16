import mongoose from "mongoose";

const ComplaintSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    priority: {
      type: String,
      trim: true,
      default: "Low",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Complaint =
  mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);