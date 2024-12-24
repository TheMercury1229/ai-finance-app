import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "../../../emails/template";

const isNewMonth = (date: Date, newDate: Date) => {
  return (
    date.getMonth() !== newDate.getMonth() ||
    date.getFullYear() !== newDate.getFullYear()
  );
};

function isTransactionDue(transaction: any) {
  // if no processed date, return true
  if(!transaction.processedDate) return true;

  // if processed date is in the future, return true
  const today=new Date();
  const nextDue=new Date(transaction.nextRecurringDate);
  return nextDue>=today;
  
}
export const checkBudgetAlert = inngest.createFunction(
  { id: "check-budget-alert", name: "Check Budget Alert" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budget", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });
    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) {
        continue;
      }
      await step.run("check-budget", async () => {
        const currentDate = new Date();
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        ); //Start of the month

        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ); //End of the month
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });
        const totalExpenses = expenses._sum.amount || 0;
        const budgetAmount = budget.amount || 0;
        const percentUsed =
          (Number(totalExpenses) / Number(budgetAmount)) * 100 || 0;

        if (
          percentUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // Send alert to user
          sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name || "",
              type: "budget-alert",
              data: {
                budgetAmount: Number(budgetAmount).toFixed(1),
                totalExpenses: Number(totalExpenses).toFixed(1),
                percentageUsed: Number(percentUsed).toFixed(1),
              },
            }),
          });

          // Update lastAlertSent
          await db.budget.update({
            where: {
              id: budget.id,
            },
            data: {
              lastAlertSent: new Date(),
            },
          });
        }
      });
    }
  }
);

export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const recurringTransaction = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "PROCESSED",
            OR: [
              { lastProcessedDate: null }, //Never processed
              { nextRecurringDate: { lte: new Date() } }, //Due date passed
            ],
          },
        });
      }
    );
    // Create a new transaction for each recurring transaction
    if (recurringTransaction.length > 0) {
      const events = recurringTransaction.map((transaction) => ({
        name: "transaction.recurring.process",
        data: { transactionId: transaction.id, userId: transaction.userId },
      }));
      // Send events
      await inngest.send(events);
    }
    return { triggered: recurringTransaction.length };
  }
);

export const processRecurringTransactions = inngest.createFunction({
  id: "process-recurring-transactions",
  throttle: {
    limit: 10,
    period: "1m",
    key: "event.data.userId",
  }
  },
   {
    event: "transaction.recurring.process",
  },
  async ({ event,step }) => {
    if(!event?.data?.transactionId||!event.data?.userId){
      console.log("Invalid event data");
      return {error:"Missing transactionId or userId"};
  }
  await step.run('process-transaction',async () => {
    const transaction = await db.transaction.findUnique({
      where: {
        id: event.data.transactionId,
        userId: event.data.userId
      },
      include:{
        account: true
      }

    });
    if (!transaction) {
      console.log("Transaction not found");
      return {error:"Transaction not found"};
    }
    if(!isTransactionDue(transaction)){
      return;
    }
    await db.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          type: transaction.type,
          amount: transaction.amount,
          description: `${transaction.description} - Recurring`,
          date: new Date(),
          category: transaction.category,
          status: "PROCESSED",
          userId: transaction.userId,
          accountId: transaction.accountId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isRecurring:false
        }
      })
      const balanceChange = transaction.type === "INCOME" ? transaction.amount.toNumber() : -transaction.amount.toNumber();
      await tx.account.update({
        where: {
          id: transaction.accountId
        },
        data: {
          balance: {
            increment: balanceChange
          }
      },
      })
      await tx.transaction.update({
        where: {
          id: transaction.id
        },
        data: {
          lastProcessedDate: new Date(),
          nextRecurringDate:calculateNextRecurringDate(new Date(),transaction.recurringInterval||"MONTHLY")
        }
      })
    });
    
  })
}

);


function calculateNextRecurringDate(date:Date,interval:string){
  const nextDate = new Date(date);
  if(interval === "DAILY"){
    nextDate.setDate(nextDate.getDate() + 1);
  }else if(interval === "WEEKLY"){
    nextDate.setDate(nextDate.getDate() + 7);
  }else if(interval === "MONTHLY"){
    nextDate.setMonth(nextDate.getMonth() + 1);
  }else if(interval === "YEARLY"){
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  return nextDate;
}