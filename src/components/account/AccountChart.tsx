"use client";

import { Transaction } from "@prisma/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
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

import { endOfDay, format, startOfDay, subDays } from "date-fns";

const DATE_RANGES = {
  "7D": { label: "Last 7 days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

const AccountChart = ({ transactions }: { transactions: Transaction[] }) => {
  const [dateRange, setDateRange] = useState<"7D" | "1M" | "3M" | "6M" | "ALL">(
    "1M"
  );

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const filtered = transactions.filter(
      (transaction) =>
        new Date(transaction.date) >= startDate &&
        new Date(transaction.date) < endOfDay(now)
    );

    const grouped = filtered.reduce(
      (
        acc: {
          [key: string]: { date: string; income: number; expense: number };
        },
        transaction
      ) => {
        const date = format(new Date(transaction.date), "MMM dd");
        if (!acc[date]) {
          acc[date] = { date, income: 0, expense: 0 };
        }

        if (transaction.type === "INCOME") {
          acc[date].income += Number(transaction.amount);
        } else {
          acc[date].expense += Number(transaction.amount);
        }
        return acc;
      },
      {}
    ) as Record<string, { date: string; income: number; expense: number }>;

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => ({
        ...item,
        income: parseFloat(item.income.toFixed(2)),
        expense: parseFloat(item.expense.toFixed(2)),
      }));
  }, [transactions, dateRange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc: { income: number; expense: number }, transaction) => {
        return {
          income: acc.income + transaction.income,
          expense: acc.expense + transaction.expense,
        };
      },
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">
          Transactions Overview
        </CardTitle>
        <Select
          value={dateRange}
          onValueChange={(value: "7D" | "1M" | "3M" | "6M" | "ALL") =>
            setDateRange(value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Total Income</p>
            <p className="text-green-500 text-xl font-bold">
              Rs. {totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Total Expenses</p>
            <p className="text-red-500 text-xl font-bold">
              Rs. {totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Net</p>
            <p
              className={`${
                totals.income - totals.expense < 0
                  ? "text-red-500"
                  : "text-green-500"
              } text-xl font-bold`}
            >
              Rs. {(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rs. ${value.toFixed(2)}`}
              />
              <Tooltip
                formatter={(value) => `Rs. ${(value as number).toFixed(2)}`}
                cursor
              />
              <Legend />
              <Bar
                dataKey="income"
                name={"Income"}
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name={"Expense"}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
};

export default AccountChart;
