"use server";
import aj from "@/lib/arcjet";
import { genAi } from "@/lib/gemini";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { InlineDataPart } from "@google/generative-ai";
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
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert array buffer to base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");
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

      If its not a recipt, return an empty object`;
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
     prompt,
    ]);
    const response=await result.response;
    const text=await response.text();
    const cleanedText=text.replace(/```(?:json)?\n?/g,"").trim();
    try {
        const data=JSON.parse(cleanedText);
        return {
            amount: parseFloat(data.amount),
            date: new Date(data.date),
            description: data.description,
            category: data.category,
            merchantName: data.merchantName
        }   
    } catch (error) {
        console.log("Error in parsing JSON",error);
        throw new Error("Failed to parse JSON");
    }
  } catch (error) {
    console.error(
      "Error in scanning reciept",
      error instanceof Error ? error : { message: "Unknown error", error }
    );
    throw new Error("Failed to scan reciept");
  }
}
