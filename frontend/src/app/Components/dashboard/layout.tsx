import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden min-h-screen">
      <div>{children}</div>
    </div>
  );
}
