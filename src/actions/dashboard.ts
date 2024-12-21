"use server";

import { db } from "@/lib/prisma";
import { createAccountType } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { Account } from "@prisma/client";
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
export async function createAccount({
  name,
  type,
  balance,
  isDefault,
}: createAccountType) {
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
    // Convert the balance to float
    const balanceFloat = parseFloat(balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance");
    }
    const existingAccount = await db.account.findMany({
      where: {
        userId: user.id,
      },
    });
    const shouldBeDefault = existingAccount.length === 0 ? true : isDefault;
    //    If the account should be default, update all other accounts to not be default
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    const account = await db.account.create({
      data: {
        name,
        type,
        balance: balanceFloat,
        isDefault: shouldBeDefault,
        userId: user.id,
      },
    });
    const serialisedAccount = serialiseTransaction(account);
    revalidatePath("/dashboard");
    return { success: true, account: serialisedAccount };
  } catch (error: any) {
    console.error("Error in createAccount", error);
    return { success: false, error: error.message };
  }
}

export async function getUserAccounts(): Promise<Account[]> {
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

  const accounts = await db.account.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });
  const serialisedAccounts = accounts.map((account) =>
    serialiseTransaction(account)
  );
  return serialisedAccounts;
}
