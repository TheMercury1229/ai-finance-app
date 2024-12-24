import { getAccountWithTransaction } from "@/actions/account";
import AccountChart from "@/components/account/AccountChart";
import TransactionsTable from "@/components/account/TransactionsTable";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import BarLoader from "react-spinners/BarLoader";

const AccountPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const accountData = await getAccountWithTransaction(id);
  if (!accountData) {
    return notFound();
  }
  const { transactions, ...account } = accountData;
  return (
    <div className="space-y-8 px-5 ">
      <div className="flex  gap-4 items-end justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>
        <div className="text-right pb-2">
          <h3 className="text-xl sm:text-2xl font-bold">
            Rs.{account.balance.toFixed(2)}
          </h3>
          <p className="text-muted-foreground text-sm">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>
      {/* Chart */}
      <Suspense
        fallback={
          <>
            <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
          </>
        }
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transaction Table */}
      <Suspense
        fallback={
          <>
            <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
          </>
        }
      >
        <TransactionsTable transactions={transactions} />
      </Suspense>
    </div>
  );
};

export default AccountPage;
