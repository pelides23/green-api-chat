import { ROUTES } from "@/shared/model/routes";
import { createBrowserRouter, redirect } from "react-router-dom";
import App from "./App";
import { Provider } from "./provider";
import { AuthProvider } from "./auth-provider";

export const router = createBrowserRouter([
  {
    element: (
      <Provider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    ),
    children: [
      {
        path: ROUTES.LOGIN,
        lazy: () => import("@/features/login/login.page"),
      },
      {
        path: ROUTES.CHAT,
        lazy: () => import("@/features/chat/chat.page"),
      },
    ],
  },
  {
    path: "*",
    loader: () => redirect(ROUTES.LOGIN),
  },
]);
