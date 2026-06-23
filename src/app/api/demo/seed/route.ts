import { runDemoSeed } from "@/lib/demo/seed";

export async function GET() {
  const result = await runDemoSeed();
  return Response.json(result);
}
