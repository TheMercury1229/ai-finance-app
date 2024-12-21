import { seedTransactions } from "@/actions/seed";

export async function GET() {
  const res = await seedTransactions();
  return Response.json(res);
}
