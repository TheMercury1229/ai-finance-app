import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";

export const Header = async () => {
  await checkUser();
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={"/"}>
          <Image
            src="/logo.svg"
            alt="Wealthify"
            width={50}
            height={50}
            className="h-12 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton forceRedirectUrl={"/dashboard"}>
              <Button>Login</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-yellow-600 flex items-center gap-2"
            >
              <Button
                variant={"outline"}
                className="text-gray-600 hover:text-yellow-600"
              >
                <LayoutDashboard className="size-8" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <Link
              href="/transaction/create"
              className="text-gray-600 hover:text-yellow-600 flex items-center gap-2"
            >
              <Button variant={"default"}>
                <PenBox className="size-8" />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};
