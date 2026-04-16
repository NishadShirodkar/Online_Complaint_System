import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Complaint } from "@/models/Complaint";

const VALID_STATUSES = ["Pending", "In Progress", "Resolved"];

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(complaint, { status: 200 });
  } catch (error) {
    console.error("Failed to update complaint:", error);

    return NextResponse.json(
      { error: "Unable to update complaint." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await dbConnect();

    const complaint = await Complaint.findByIdAndDelete(id);

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Complaint deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete complaint:", error);

    return NextResponse.json(
      { error: "Unable to delete complaint." },
      { status: 500 }
    );
  }
}
