"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Pencil, X } from "lucide-react";
import { updateBudget } from "@/actions/budget";
import useFetch from "@/hooks/useFetch";
import { toast } from "sonner";

const BudgetProgress = (props: {
  initalBudget: any;
  currentExpense: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    props.initalBudget?.amount?.toString() || ""
  );
  const percentUsed =
    (props?.currentExpense / props.initalBudget?.amount) * 100 || 0;

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);
  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) && amount < 0) {
      toast.error("Invalid amount");
    }
    await updateBudgetFn(amount);
  };
  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      setNewBudget(props.initalBudget?.amount?.toString() || "");
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to update budget");
    }
  }, [error]);
  const handleCancel = () => {
    setIsEditing(false);
    setNewBudget(props.initalBudget?.amount?.toString() || "");
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle>Budget Progress</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newBudget}
                  type="number"
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                  placeholder="Enter amount..."
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant={"ghost"}
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                >
                  <Check className="size-4 text-green-500" />
                </Button>
                <Button
                  disabled={isLoading}
                  variant={"ghost"}
                  size="icon"
                  onClick={handleCancel}
                >
                  <X className="size-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
                  {props.initalBudget
                    ? `${props.currentExpense.toFixed(
                        2
                      )} of  ${props.initalBudget.amount.toFixed(2)} spent .`
                    : "No budget set"}
                </CardDescription>
                <Button
                  variant={"ghost"}
                  onClick={() => setIsEditing(true)}
                  className="size-6"
                >
                  <Pencil className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {props.initalBudget && (
          <div>
            <Progress
              value={percentUsed}
              //   @ts-ignore
              extraStyles={`${
                percentUsed >= 90
                  ? "bg-red-500"
                  : percentUsed >= 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            />
            <p className="text-sm mt-2 text-muted-foreground text-right">
              {percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
