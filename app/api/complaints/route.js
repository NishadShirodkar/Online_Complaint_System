import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { categorizeComplaint } from "@/lib/ai";
import { Complaint } from "@/models/Complaint";

function resolvePriority(totalComplaints) {
  if (totalComplaints >= 5) {
    return "High";
  }

  if (totalComplaints >= 3) {
    return "Medium";
  }

  return "Low";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const text = body?.text?.trim();
    const imageUrl = body?.imageUrl?.trim() || "";

    if (!text) {
      return NextResponse.json(
        { error: "The 'text' field is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    let category = "Other";

    try {
      category = await categorizeComplaint(text);
    } catch (error) {
      console.error("Failed to categorize complaint with AI:", error);
    }

    const existingCount = await Complaint.countDocuments({ category });
    const priority = resolvePriority(existingCount + 1);

    const complaint = await Complaint.create({
      text,
      imageUrl,
      category,
      priority,
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Failed to create complaint:", error);

    return NextResponse.json(
      { error: "Unable to create complaint." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const complaints = await Complaint.aggregate([
      {
        $addFields: {
          priorityRank: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "High"] }, then: 0 },
                { case: { $eq: ["$priority", "Medium"] }, then: 1 },
              ],
              default: 2,
            },
          },
        },
      },
      {
        $sort: {
          priorityRank: 1,
          createdAt: -1,
        },
      },
      {
        $project: {
          priorityRank: 0,
        },
      },
    ]);

    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch complaints:", error);

    return NextResponse.json(
      { error: "Unable to fetch complaints." },
      { status: 500 }
    );
  }
}