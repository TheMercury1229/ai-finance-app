import { getUserAccounts } from "@/actions/dashboard";
import { getTransaction } from "@/actions/transactions";
import AddTransactionForm from "@/components/transaction/AddTransactionForm";
import { defaultCategories } from "@/data/category";
import { Transaction } from "@prisma/client";

const AddTransactionPage = async({searchParams}:{searchParams:any}) => {
    const accounts = await getUserAccounts();
    const editId=await searchParams?.edit
    let initialData={};
    if(editId){
      const transaction=await getTransaction(editId);
      initialData={...transaction.data};
    }
  return (
    <div className="mx-auto max-w-3xl px-5">
        <h1 className="text-4xl font-semibold gradient-title">Add Transaction</h1>
        <AddTransactionForm 
            accounts={accounts} 
            editMode={!!editId} 
            initialData={initialData as Transaction} 
            categories={defaultCategories} 
        />
    </div>
  )
}

export default AddTransactionPage