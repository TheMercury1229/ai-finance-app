import { getUserAccounts } from "@/actions/dashboard";
import AddTransactionForm from "@/components/transaction/AddTransactionForm";
import { defaultCategories } from "@/data/category";

const AddTransactionPage = async() => {
    const accounts = await getUserAccounts();
  return (
    <div className="mx-auto max-w-3xl px-5">
        <h1 className="text-4xl font-semibold gradient-title">Add Transaction</h1>
        <AddTransactionForm accounts={accounts} categories={defaultCategories} />
    </div>
  )
}

export default AddTransactionPage