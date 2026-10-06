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
        element: <div>Chat</div>,
        path: ROUTES.CHAT,
      },
    ],
  },
  {
    path: "*",
    loader: () => redirect(ROUTES.LOGIN),
  },
]);
