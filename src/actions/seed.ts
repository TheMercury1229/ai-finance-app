import { db } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { subDays } from "date-fns";

const ACCOUNT_ID = "0e8fcea9-0ba9-4256-8a61-d42810d896e8";
const USER_ID = "078a673e-af6f-4c91-958b-8e901dda315a";

const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

function getRandomAmount(min: number, max: number) {
  return new Decimal((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type: "INCOME" | "EXPENSE") {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    const transactions: any = [];
    let totalBalance = new Decimal(0);

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < transactionsPerDay; j++) {
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${
            type === "INCOME" ? "Received" : "Paid for"
          } ${category}`,
          date,
          category,
          status: "PROCESSED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance = totalBalance.add(
          type === "INCOME" ? amount : amount.neg()
        );
        transactions.push(transaction);
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: ACCOUNT_ID } });
      await tx.transaction.createMany({ data: transactions });
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error: any) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}
