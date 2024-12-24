import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { AccountCard } from "@/components/dashboard/AccountCard";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Account } from "@prisma/client";
import { PlusIcon } from "lucide-react";
import React, { Suspense } from "react";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import BarLoader from "react-spinners/BarLoader";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

const DashboardPage = async () => {
  const accounts = await getUserAccounts();
  const defaultAccount = accounts.find((account) => account.isDefault);
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }
  const transactions = await getDashboardData();
  return (
    <div className="px-5 space-y-8">
      {/* Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
          initalBudget={budgetData?.budget || 0}
          currentExpense={budgetData?.currentExpenses || 0}
        />
      )}

      {/* Overview */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <DashboardOverview accounts={accounts} transactions={transactions} />
      </Suspense>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow transition-shadow border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <PlusIcon className="size-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account: Account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
};

export default DashboardPage;
