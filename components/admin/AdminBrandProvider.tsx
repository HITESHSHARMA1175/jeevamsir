"use client";

import { createContext, useContext } from "react";

const AdminBrandContext = createContext("Admin Console");

export function AdminBrandProvider({
  brandName,
  children,
}: {
  brandName: string;
  children: React.ReactNode;
}) {
  return (
    <AdminBrandContext.Provider value={brandName}>
      {children}
    </AdminBrandContext.Provider>
  );
}

export function useAdminBrandName() {
  return useContext(AdminBrandContext);
}

