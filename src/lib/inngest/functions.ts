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
        const percentUsed = (Number(totalExpenses) / Number(budgetAmount)) * 100 || 0;

        if (
          percentUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // Send alert to user
          sendEmail({
            to: budget.user.email,
            subject:`Budget Alert for ${defaultAccount.name}`,
            react:EmailTemplate(
              {
                userName: budget.user.name || "",
                type: "budget-alert",
                data: {
                  budgetAmount: Number(budgetAmount).toFixed(1),
                  totalExpenses: Number(totalExpenses).toFixed(1),
                  percentageUsed:  Number(percentUsed).toFixed(1),
                },
              }
            ) ,

          })

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
