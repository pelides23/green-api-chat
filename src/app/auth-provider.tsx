import { AuthContext, type Credentials } from "@/shared/model/auth-context";
import { useState, type ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <AuthContext.Provider value={{ credentials, setCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}
