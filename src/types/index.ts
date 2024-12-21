import { AccountType } from "@prisma/client";

export type createAccountType = {
  name: string;
  type: AccountType;
  balance: string;
  isDefault: boolean;
};
