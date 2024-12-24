"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import RecieptScanner from "./RecieptScanner";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/lib/zodSchema";
import { Account, Transaction } from "@prisma/client";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import useFetch from "@/hooks/useFetch";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { Category } from "@/data/category";

const AddTransactionForm = ({
  accounts,
  categories,
  editMode,
  initialData,
}: {
  accounts: Account[];
  categories: Category[];
  editMode?: boolean;
  initialData?: Transaction;
}) => {
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");

  const router = useRouter();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editId && editMode && initialData
        ? {
            type: initialData.type,
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            isRecurring: initialData.isRecurring,
            amount: String(initialData.amount),
            date: new Date(initialData.date),
            ...(initialData.recurringInterval ? { recurringInterval: initialData.recurringInterval } : {})
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId:
              accounts.find((account) => account.isDefault)?.id ||
              accounts[0].id,
            date: new Date(),
            isRecurring: false,
            category: categories[0].id,
            recurringInterval: "DAILY",
          },
  });

  const {
    loading: isLoading,
    fn: transactionFn,
    data: transactionRes,
  } = useFetch(editId? updateTransaction : createTransaction);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  const onSubmit = async (data: any) => {
    const formData = {
      ...data,
      amount: Number(data.amount),
    };

    await editId ? transactionFn(editId,formData) : transactionFn(formData);
  };

  useEffect(() => {
    if (transactionRes?.success && !isLoading) {
      if(editId){
        toast.success("Transaction updated successfully");
      }else{
      toast.success("Transaction added successfully");
      }
      reset();
      router.push(`/account/${transactionRes.data.accountId}`);
    }
  }, [transactionRes, isLoading]);

  const handleScanComplete = useCallback(
    (data: any) => {
      if (data) {
        setValue("amount", data.amount?.toString());
        if (data.description) setValue("description", data.description);
        setValue("category", data.category);
        setValue("date", new Date(data.date));
      }
    },
    [setValue]
  );

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {/* Receipt Scanner */}
      {!editId && <RecieptScanner onScanComplete={handleScanComplete} />}

      {/* Transaction Type */}
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-red-500">{errors.type.message}</p>}
      </div>

      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step={0.01}
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-red-500">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="account" className="text-sm font-medium">
            Account
          </label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={watch("accountId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} - {Number(account.balance).toFixed(2)}
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button className="w-full" variant="ghost">
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Categories and Date */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <Select
            onValueChange={(value) => setValue("category", value)}
            defaultValue={watch("category")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-red-500">{errors.category.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">
            Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full text-left">
                {date ? format(date, "PPP") : "Pick a date"}
                <CalendarIcon className="ml-auto size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) =>
                  selectedDate && setValue("date", selectedDate)
                }
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-red-500">{errors.date.message}</p>}
        </div>
      </div>

      {/* Recurring Transaction */}
      <div className="flex items-center justify-between space-y-2 rounded-lg border p-3">
        <div>
          <label htmlFor="isRecurring" className="text-sm font-medium">
            Recurring transaction
          </label>
          <p className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </p>
        </div>
        <Switch
          onCheckedChange={(value) => setValue("isRecurring", value)}
          checked={isRecurring}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <label htmlFor="recurringInterval" className="text-sm font-medium">
            Recurring Interval
          </label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={watch("recurringInterval")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recurring interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-red-500">{errors.recurringInterval.message}</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center mt-4 justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2Icon className="animate-spin mr-2" />
             {editId? "Updating...": "Creating..."}
            </>
          ) : (
            editId?"Update Transaction":"Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
