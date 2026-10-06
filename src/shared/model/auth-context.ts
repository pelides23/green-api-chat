import { createContext } from "react";

export type Credentials = {
  idInstance: string;
  apiTokenInstance: string;
};

type AuthContext = {
  credentials: Credentials | null;
  setCredentials: (value: Credentials | null) => void;
};

export const AuthContext = createContext<AuthContext | null>(null);
