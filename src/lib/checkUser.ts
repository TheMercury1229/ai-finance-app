import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) {
    return null;
  }
  try {
    const loginUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });
    if (loginUser) {
      return loginUser;
    }
    const name = `${user.firstName} ${user.lastName}`;
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        name,
      },
    });
    return newUser;
  } catch (error) {
    console.error("Error in the check user", error);
  }
};
