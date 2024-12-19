import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center pt-24 pb-10 mt-2">
      {children}
    </div>
  );
};

export default AuthLayout;
