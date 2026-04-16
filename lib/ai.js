import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const ALLOWED_CATEGORIES = new Set([
  "Infrastructure",
  "Cleanliness",
  "Food",
  "Hostel",
  "Academic",
  "Other",
]);

export async function categorizeComplaint(text) {
  const response = await openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You classify college complaint text into exactly one category: Infrastructure, Cleanliness, Food, Hostel, Academic, or Other. Return only the category name with no explanation, punctuation, or extra text.",
      },
      {
        role: "user",
        content: `Classify this complaint into one of these categories: Infrastructure, Cleanliness, Food, Hostel, Academic, Other.

Complaint: ${text}`,
      },
    ],
  });

  const category = response.choices?.[0]?.message?.content?.trim();

  if (!category || !ALLOWED_CATEGORIES.has(category)) {
    throw new Error("OpenAI returned an invalid category.");
  }

  return category;
}