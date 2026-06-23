import { chatCompletion } from "./openai";

type ProviderForSummary = {
  name: string;
  services: string[];
  rating_avg: number;
  hourly_rate: number;
  years_experience?: number | null;
  jobs_completed?: number | null;
  description?: string;
};

type ReviewForInsights = {
  rating: number;
  comment: string;
};

export function generateProviderSummaryFallback(p: ProviderForSummary): string {
  const years = p.years_experience ?? 5;
  const jobs = p.jobs_completed ?? 50;
  const service = p.services[0] ?? "home services";
  const rating = Number(p.rating_avg).toFixed(1);

  if (Number(p.rating_avg) >= 4.5) {
    return `Top-rated ${service.toLowerCase()} professional with ${years}+ years of experience and ${jobs} completed jobs. Customers consistently praise reliability and quality (${rating}★ average).`;
  }
  if (Number(p.hourly_rate) <= 35) {
    return `Affordable ${service.toLowerCase()} specialist offering great value at $${Number(p.hourly_rate).toFixed(0)}/hr. ${years} years in the field with ${jobs} jobs completed and solid ${rating}★ feedback.`;
  }
  return `Experienced ${service.toLowerCase()} provider with ${years} years in the industry and ${jobs} completed jobs. Known for professional service with a ${rating}★ customer rating.`;
}

export async function generateProviderSummary(
  provider: ProviderForSummary
): Promise<string> {
  const ai = await chatCompletion(
    "Write a single compelling 1-2 sentence summary for a home services marketplace provider profile. Be specific and professional. No quotes.",
    `Name: ${provider.name}\nServices: ${provider.services.join(", ")}\nRating: ${provider.rating_avg}\nRate: $${provider.hourly_rate}/hr\nExperience: ${provider.years_experience} years\nJobs: ${provider.jobs_completed}\nBio: ${provider.description?.slice(0, 200)}`,
    80
  );
  return ai ?? generateProviderSummaryFallback(provider);
}

export function generateReviewInsightsFallback(reviews: ReviewForInsights[]) {
  const positive = reviews.filter((r) => r.rating >= 4);
  const negative = reviews.filter((r) => r.rating <= 3);

  const likes: string[] = [];
  const complaints: string[] = [];

  const allText = positive.map((r) => r.comment.toLowerCase()).join(" ");
  if (/professional|on time|punctual/.test(allText)) likes.push("Professional and punctual");
  if (/affordable|fair|price|value/.test(allText)) likes.push("Fair pricing and good value");
  if (/friendly|knowledgeable|communicat/.test(allText)) likes.push("Friendly and great communication");
  if (/quality|great job|recommend|exceed/.test(allText)) likes.push("High-quality workmanship");
  if (/clean|spotless/.test(allText)) likes.push("Leaves workspace clean");

  if (likes.length === 0) likes.push("Reliable service and good results");

  negative.forEach((r) => {
    if (/late|delay/.test(r.comment.toLowerCase())) complaints.push("Occasional scheduling delays");
    if (/two visit|took/.test(r.comment.toLowerCase())) complaints.push("Some jobs required follow-up visits");
  });

  if (complaints.length === 0 && negative.length > 0) {
    complaints.push("Minor issues mentioned by a few customers");
  }
  if (complaints.length === 0) {
    complaints.push("No significant complaints — overwhelmingly positive feedback");
  }

  return { likes: likes.slice(0, 4), complaints: complaints.slice(0, 2) };
}

export async function generateReviewInsights(reviews: ReviewForInsights[]) {
  if (reviews.length === 0) {
    return { likes: ["No reviews yet"], complaints: ["Not enough data"] };
  }

  const reviewText = reviews
    .map((r) => `${r.rating}★: ${r.comment}`)
    .join("\n");

  const ai = await chatCompletion(
    `Summarize customer reviews into JSON: {"likes": ["..."], "complaints": ["..."]}. 
likes = 2-4 short bullet points of what people praise.
complaints = 1-2 honest minor issues, or say "No significant complaints" if none.
Return ONLY JSON.`,
    reviewText,
    200
  );

  if (ai) {
    try {
      return JSON.parse(ai.replace(/```json\n?|\n?```/g, "")) as {
        likes: string[];
        complaints: string[];
      };
    } catch {
      // fall through
    }
  }

  return generateReviewInsightsFallback(reviews);
}
