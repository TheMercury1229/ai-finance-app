'use client'
import { Account, Transaction } from "@prisma/client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowDownRight } from "lucide-react";
import { Cell, Legend, Pie,PieChart, ResponsiveContainer } from "recharts";

const colors = [
  "#FF6B6B", // Bright Red
  "#1E90FF", // Dodger Blue
  "#32CD32", // Lime Green
  "#FFD700", // Gold
  "#FF4500", // Orange Red
  "#8A2BE2", // Blue Violet
  "#00CED1", // Dark Turquoise
];


const DashboardOverview = ({
  accounts,
  transactions,
}: {
  accounts: Account[];
  transactions: Transaction[];
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<
    Account["id"] | null
  >(accounts.find((account) => account.isDefault)?.id || null);

  const filteredTransactions = transactions.filter(
    (transaction) => transaction.accountId === selectedAccountId
  );

  const recentTransactions = filteredTransactions
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const currentDate = new Date();
  const currentMonthTransactions = filteredTransactions.filter(
    (transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.type === "EXPENSE" &&
        transactionDate.getFullYear() === currentDate.getFullYear() &&
        transactionDate.getMonth() === currentDate.getMonth()
      );
    }
  );

  const expenseByCategory = currentMonthTransactions.reduce(
    (acc: { [key: string]: number }, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(transaction.amount);
      return acc;
    },
    {}
  );

  const expenseByCategoryObj = Object.entries(expenseByCategory).map(
    ([category, amount]) => ({
      name: category,
      value: Number(amount.toFixed(2)),
    })
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Recent Transactions
          </CardTitle>
          <Select
            value={selectedAccountId || ""}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem
                  key={account.id}
                  value={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No recent transactions
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description || "Untitled Transaction"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.date), "PP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center",
                        transaction.type === "INCOME"
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {transaction.type === "EXPENSE" ? (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="mr-1 h-4 w-4" />
                      )}
                      Rs.{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-5">
          {expenseByCategoryObj.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent transactions this month.
            </p>
          ) : (
            <div className="h-[300px]">

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategoryObj}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  fill="#8884d8"
                  label={({ name, value }) => `${name}: Rs.${value.toFixed(2)}`}
                >
                  {expenseByCategoryObj.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;

