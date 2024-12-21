"use client";
import { Transaction } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { categoryColors } from "@/data/category";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TransactionsTable = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const recurringIntervals = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
  };
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "">("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortedConfig, setSortedConfig] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({ field: "date", order: "desc" });
  const handleSort = (field: string) => {
    setSortedConfig((prevConfig) => ({
      ...prevConfig,
      field,
      order:
        prevConfig.field === field && prevConfig.order === "asc"
          ? "desc"
          : "asc",
    }));
  };
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((t) =>
        t.description?.toLowerCase().includes(searchLower)
      );
    }
    // Apply recurring filter
    if (recurringFilter) {
      result = result.filter((t) => {
        if (recurringFilter === "recurring") return t.isRecurring;
        else {
          return !t.isRecurring;
        }
      });
    }
    // Apply type filter
    if (type) {
      result = result.filter((t) => t.type === type);
    }
    // Apply sorting
    result.sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortedConfig.field) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
          break;
      }
      return sortedConfig.order === "asc" ? comparison : -comparison;
    });
    return result;
  }, [transactions, searchTerm, type, recurringFilter, sortedConfig]);

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === filteredAndSortedTransactions.length
        ? []
        : filteredAndSortedTransactions.map((t) => t.id)
    );
  };
  const handleBulkDelete = () => {};
  const handleClearFilters = () => {
    setSearchTerm("");
    setType("");
    setRecurringFilter("");
    setSelectedIds([]);
  };
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 ">
          <Select
            value={type}
            onValueChange={(value) => setType(value as "INCOME" | "EXPENSE")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(value) => setRecurringFilter(value)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder="All Transactions"
                className="w-[150px]"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Reccuring</SelectItem>
              <SelectItem value="non-recurring">Non Recurring</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <Button
              onClick={() => handleBulkDelete()}
              className="flex items-center gap-2"
              variant="destructive"
              size={"sm"}
            >
              <TrashIcon className="size-4 mr-1" />
              Delete Selected {selectedIds.length}
            </Button>
          )}

          {(searchTerm || type || recurringFilter) && (
            <Button
              title="Clear Filters"
              variant={"outline"}
              size={"icon"}
              className="flex items-center justify-center px-2 py-1"
              onClick={handleClearFilters}
            >
              <XIcon className="w-6 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  className="rounded-sm"
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length === filteredAndSortedTransactions.length
                  }
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {sortedConfig.field === "date" &&
                    (sortedConfig.order === "asc" ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category
                  {sortedConfig.field === "category" &&
                    (sortedConfig.order === "asc" ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortedConfig.field === "amount" &&
                    (sortedConfig.order === "asc" ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recuring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.length === 0 && (
              <TableCell
                colSpan={7}
                className="h-16 text-center text-muted-foreground text-xl"
              >
                No Transactions Found
              </TableCell>
            )}
            {filteredAndSortedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="w-[50px]">
                  <Checkbox
                    onCheckedChange={() => handleSelect(transaction.id)}
                    checked={selectedIds.includes(transaction.id)}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(transaction.date), "PP")}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="capitalize">
                  <span
                    style={{ background: categoryColors[transaction.category] }}
                    className="px-2 py1 rounded text-white text-sm"
                  >
                    {transaction.category}
                  </span>
                </TableCell>
                <TableCell
                  className="text-right font-medium"
                  style={{
                    color: transaction.type === "INCOME" ? "green" : "red",
                  }}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  {transaction.isRecurring ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                            <RefreshCcw className="h-4 w-4" />
                            {recurringIntervals
                              ? [transaction.recurringInterval]
                              : ""}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="px-2 py-1 rounded-md">
                          <p className="font-medium text-sm">Next Date:</p>
                          <div>
                            {format(
                              new Date(transaction.nextRecurringDate || ""),
                              "PP"
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Badge variant={"outline"} className="gap-1">
                      <Clock className="h-4 w-4" />
                      One Time
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={"ghost"} className="size-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>More Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(
                            `/transaction/create?edit=${transaction.id}`
                          );
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        //    onClick={()=>deleteFn([transaction.id])}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionsTable;
