import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { categorizeComplaint } from "@/lib/ai";
import { uploadImageToS3 } from "@/lib/s3";
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
    const contentType = request.headers.get("content-type") || "";
    let text = "";
    let imageUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const textValue = formData.get("text");
      const imageFile = formData.get("image");

      text = typeof textValue === "string" ? textValue.trim() : "";

      if (imageFile instanceof File && imageFile.size > 0) {
        const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
        imageUrl = await uploadImageToS3(
          fileBuffer,
          imageFile.type,
          imageFile.name
        );
      }
    } else {
      const body = await request.json();
      text = body?.text?.trim();
      imageUrl = body?.imageUrl?.trim() || "";
    }

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