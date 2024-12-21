"use client";

import { Account } from "@prisma/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import useFetch from "@/hooks/useFetch";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";
import { useEffect } from "react";
export const AccountCard = ({ account }: { account: Account }) => {
  const { name, balance, type, id, isDefault } = account;
  const {
    loading: updateDefaultAccountLoading,
    fn: updateDefaultAccountFn,
    data: updateDefaultAccountData,
    error: updateDefaultAccountError,
  } = useFetch(updateDefaultAccount);
  const handleDefaultAccount = async (event: any) => {
    // If the account is already default, return
    if (isDefault) {
      toast.warning("You need at least one default account");
      return;
    }
    // Update the default account
    await updateDefaultAccountFn(id);
  };
  useEffect(() => {
    if (updateDefaultAccountData && !updateDefaultAccountLoading) {
      toast.success("Default account updated successfully");
    }
  }, [updateDefaultAccountData, updateDefaultAccountLoading]);
  useEffect(() => {
    if (updateDefaultAccountError) {
      toast.error("Failed to update default account");
    }
  }, [updateDefaultAccountData, updateDefaultAccountError]);
  return (
    <Card className="hover:shadow-md group relative transition-shadow">
      <CardHeader className="flex flex-row items-center w-full justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        <Switch
          checked={isDefault}
          onClick={handleDefaultAccount}
          disabled={updateDefaultAccountLoading}
        />
      </CardHeader>
      <CardContent>
        <h4 className="text-2xl font-bold">
          Rs.{parseFloat(balance.toString()).toFixed(2)}
        </h4>
        <p className="text-xs text-muted-foreground">
          {type.charAt(0) + type.slice(1).toLowerCase()} Account
        </p>
      </CardContent>
      <CardFooter className="flex justify-between text-muted-foreground text-sm">
        <div className="flex items-center">
          <ArrowUpRight className="mr-1 size-4 text-green-500" />
          <span>Income</span>
        </div>
        <div className="flex items-center">
          <ArrowDownRight className="mr-1 size-4 text-red-500" />
          <span>Expense</span>
        </div>
        <Link
          href={`/account/${id}`}
          className="text-sm  px-3 py-1 bg-yellow-200 text-yellow-700 rounded-full"
        >
          Learn more
        </Link>
      </CardFooter>
    </Card>
  );
};
