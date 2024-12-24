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
import { Category } from "@/data/category";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/lib/zodSchema";
import { Account } from "@prisma/client";
import { useForm } from "react-hook-form";
import useFetch from "@/hooks/useFetch";
import { createTransaction } from "@/actions/transactions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import { format } from "date-fns";
import { CalendarIcon, CloudFog } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import RecieptScanner from "./RecieptScanner";
const AddTransactionForm = ({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId:
        accounts.find((account) => account.isDefault)?.id || accounts[0].id,
      date: new Date(),
      isRecurring: false,
      category: categories[0].id,
      recurringInterval: "DAILY",
    },
  });
  const router = useRouter();
  const filteredCategories = categories.filter(
    (category) => category.type === getValues("type")
  );
  const {
    loading: isLoading,
    fn: transactionFn,
    data: transactionRes,
    error,
  } = useFetch(createTransaction);
  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
    const onSubmit = async (data: any) => {
  const formData = {
    ...data,
    amount: Number(data.amount),
  };
  
  await transactionFn(formData);

  };
  useEffect(() => {
    if (transactionRes?.success && !isLoading) {
      toast.success("Transaction added successfully");
      reset();
      router.push(`/account/${transactionRes.data.accountId}`);
    }
  }, [transactionRes, isLoading]);
  const handleScanComplete = (data: any) => {
    if (data) {
      setValue("amount",data.amount?.toString());
      if (data.description) {
        setValue("description", data.description);
      }

      setValue("category", data.category);
      setValue("date", new Date(data.date));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {/* Ai receipt scanner  */}
      <RecieptScanner onScanComplete={handleScanComplete} />
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <Select
          name="type"
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
            name="account"
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.name} value={account.id}>
                  {account.name} - {Number(account.balance).toFixed(2)}
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button className="w-full" variant={"ghost"}>
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
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <Select
            name="category"
            onValueChange={(value) => setValue("category", value)}
            defaultValue={getValues("category")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.name} value={category.id}>
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
              <Button
                variant={"outline"}
                className="w-full pl-3 text-left font-normal"
              >
                {date ? format(date, "PPP") : "Pick a date"}
                <CalendarIcon className="ml-auto size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                initialFocus
                selected={date}
                onSelect={(date) => date && setValue("date", date)}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </PopoverContent>
          </Popover>

          {errors.date && <p className="text-red-500">{errors.date.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Input
          type="text"
          placeholder="Add a description"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-red-500">{errors.description.message}</p>
        )}
      </div>
      <div className="space-y-2 flex items-center justify-between rounded-lg border p-3">
        <div>
          <label htmlFor="isRecurring" className="text-sm font-medium">
            Recurring transaction
          </label>
          <p className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </p>
        </div>
        <Switch
          id="isDefault"
          onCheckedChange={(value: boolean) => setValue("isRecurring", value)}
          checked={watch("isRecurring")}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <label htmlFor="recurringInterval" className="text-sm font-medium">
            Reccuring interval
          </label>
          <Select
            name="recurringInterval"
            onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY") =>
              setValue("recurringInterval", value)
            }
            defaultValue={"MONTHLY"}
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

      <div className="flex items-center mt-4 justify-end gap-2 z-[50]">
        <Button variant={"outline"} type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          Create Transaction
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
