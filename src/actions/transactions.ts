"use server";
import aj from "@/lib/arcjet";
import { genAi } from "@/lib/gemini";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { InlineDataPart } from "@google/generative-ai";
import { Transaction } from "@prisma/client";
import { revalidatePath } from "next/cache";

function calculateRecurringDate(transactionDate: Date, frequency: string) {
  const date = new Date(transactionDate);
  if (frequency === "DAILY") {
    date.setDate(date.getDate() + 1);
  } else if (frequency === "WEEKLY") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "MONTHLY") {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === "YEARLY") {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date;
}
const serialiseAmount = (obj: any) => {
  return {
    ...obj,
    amount: obj.amount.toNumber(),
  };
};
export async function createTransaction(data: any) {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data payload. Expected an object.");
    }
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
    // Rate limit - using arcjet
    const req = await request();
    const decision = await aj.protect(req, {
      userId,
      requested: 1, //Specify how many requests the user is allowed to make
    });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "TOO_MANY_REQUESTS",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Something went wrong. Please try again later.");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) {
      throw new Error("Account not found");
    }

    const balanceChange = data.type === "INCOME" ? data.amount : -data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          accountId: account.id,
          nextRecurringDate: data.isRecurring
            ? calculateRecurringDate(data.date, data.recurringInterval)
            : null,
          amount: data.amount,
        },
      });

      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    return { success: true, data: serialiseAmount(transaction) };
  } catch (error: any) {
    console.error(
      "Error in creating transaction",
      error instanceof Error ? error : { message: "Unknown error", error }
    );
    throw new Error("Failed to create transaction");
  }
}

export async function scanReciept(file: any) {
  try {
    if (!file || typeof file.arrayBuffer !== "function") {
      throw new Error("Invalid file provided");
    }

    const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert file to array buffer and then base64
    const arrayBuffer = await file.arrayBuffer();
    // Buffer.from accepts ArrayBuffer by converting to Buffer
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
    const base64String = buffer.toString("base64");

    const prompt = `Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If it's not a receipt, return an empty object`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type || "image/png",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = await response.text();

    // Remove markdown fences and any leading/trailing text
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Try to locate first { ... } in the text as a fallback
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    const jsonCandidate =
      firstBrace !== -1 && lastBrace !== -1
        ? cleanedText.slice(firstBrace, lastBrace + 1)
        : cleanedText;

    try {
      const data = JSON.parse(jsonCandidate);

      // Validate and normalize fields; return empty object when AI says it's not a receipt
      if (!data || Object.keys(data).length === 0) return {};

      const parsedAmount =
        data.amount === undefined || data.amount === null
          ? null
          : Number(parseFloat(String(data.amount)));

      const parsedDate = data.date ? new Date(data.date) : null;

      return {
        amount: parsedAmount,
        date: parsedDate,
        description: data.description || "",
        category: data.category || "other-expense",
        merchantName: data.merchantName || "",
      };
    } catch (err) {
      console.log(
        "Error in parsing JSON from model response:",
        err,
        "raw:",
        text
      );
      // Return empty object rather than throwing so callers can handle gracefully
      return {};
    }
  } catch (error) {
    console.error(
      "Error in scanning reciept",
      error instanceof Error ? error : { message: "Unknown error", error }
    );
    // Bubble up a descriptive error so callers know scanning failed
    throw new Error("Failed to scan receipt");
  }
}

export async function getTransaction(id: string) {
  try {
    const transaction = await db.transaction.findUnique({
      where: {
        id: id,
      },
    });
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return { success: true, data: serialiseAmount(transaction) };
  } catch (error: any) {
    console.error(
      "Error in getting transaction",
      error instanceof Error ? error : { message: "Unknown error", error }
    );
    throw new Error("Failed to get transaction");
  }
}

export async function updateTransaction(id: string, data: Transaction) {
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

    const transaction = await db.transaction.findUnique({
      where: {
        id: id,
      },
      include: {
        account: true,
      },
    });
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const oldBalanceChange =
      transaction.type === "INCOME"
        ? Number(transaction.amount)
        : -Number(transaction.amount);

    const newBalanceChange =
      data.type === "INCOME" ? Number(data.amount) : -Number(data.amount);

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update the transaction
    const updatedTransaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id: id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: {
          id: transaction.accountId,
        },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/transaction/${id}`);
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serialiseAmount(updatedTransaction) };
  } catch (error: any) {
    console.error(
      "Error in updating transaction",
      error instanceof Error ? error : { message: "Unknown error", error }
    );
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
