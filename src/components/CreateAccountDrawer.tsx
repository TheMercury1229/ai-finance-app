"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/lib/zodSchema";
import { useEffect, useState } from "react";
import useFetch from "@/hooks/useFetch";
import { createAccount } from "@/actions/dashboard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateAccountDrawer = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });
  const {
    data: newAccount,
    error,
    fn: createAccountFn,
    loading: createAccountLoading,
  } = useFetch(createAccount);
  const onSubmit = async (data: any) => {
    await createAccountFn(data);
  };

  useEffect(() => {
    if (newAccount && !createAccountLoading) {
      toast.success("Account created successfully.");
      reset();
      setIsOpen(false);
    }
  }, [newAccount, createAccountLoading]);

  useEffect(() => {
    if (error) {
      toast.error(error || "Failed to create account");
    }
  }, [error]);
  return (
    <Drawer open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <form
            className="space-y-4"
            onSubmit={handleSubmit((data) => {
              onSubmit(data);
            })}
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Account Name
              </label>
              <Input
                id="name"
                placeholder="Account Name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Account Type
              </label>
              <Select onValueChange={(value) => setValue("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="CURRENT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current Account</SelectItem>
                  <SelectItem value="SAVINGS">Savings Account</SelectItem>
                </SelectContent>
              </Select>

              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">
                Initial Balance
              </label>
              <Input
                id="balance"
                type="number"
                placeholder="Rs.0.00"
                step={0.01}
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-red-500 text-sm">{errors.balance.message}</p>
              )}
            </div>
            <div className="space-y-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <label htmlFor="isDefault" className="text-sm font-medium">
                  Set as Default
                </label>
                <p className="text-sm text-muted-foreground">
                  This account will be selected by default for transactions
                </p>
              </div>
              <Switch
                id="isDefault"
                onCheckedChange={(value) => setValue("isDefault", value)}
                checked={watch("isDefault")}
              />
            </div>
            <div className="flex md:inline-flex items-center gap-5">
              <DrawerClose asChild>
                <Button
                  type="button"
                  className="flex-1"
                  variant={"outline"}
                  size={"lg"}
                >
                  Close
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                size={"lg"}
                className="flex-1"
                disabled={createAccountLoading}
              >
                {createAccountLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;
