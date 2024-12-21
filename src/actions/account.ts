"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serialiseTransaction = (obj: any) => {
  const serialise = { ...obj };

  if (obj.balance) {
    serialise.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialise.amount = obj.amount.toNumber();
  }
  return serialise;
};

export async function updateDefaultAccount(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    // Update all  accounts to not be default
    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
    // Update the account to be default
    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: {
        isDefault: true,
      },
    });
    revalidatePath("/dashboard");
    return { success: true, data: serialiseTransaction(account) };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to update default account" };
  }
}

export async function getAccountWithTransaction(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const account = await db.account.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });
    if (!account) {
      return null;
    }
    return {
      ...serialiseTransaction(account),
      transactions: account.transactions.map(serialiseTransaction),
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch account" };
  }
}

export async function bulkTransactionDelete(transactionsIds: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        id: {
          in: transactionsIds,
        },
        userId: user.id,
      },
    });

    const accountBalanceChanges: { [accountId: string]: number } =
      transactions.reduce((acc, transaction) => {
        const change =
          transaction.type === "INCOME"
            ? Number(transaction.amount)
            : -Number(transaction.amount);
        acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
        return acc;
      }, {} as { [accountId: string]: number });

    // Delete the transactions and update the account balances in a transaction
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: {
            in: transactionsIds,
          },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: {
              increment: Number(balanceChange), // Ensure balanceChange is a number
            },
          },
        });
      }
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/account/[accountId]", "layout");
    return { success: true };
  } catch (error: any) {
    console.error(error.message);
    return { success: false, message: "Failed to delete transactions" };
  }
}
