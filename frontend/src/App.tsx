import { RouterProvider } from "react-router-dom";

import { AuthInitializer } from "@/auth/components/AuthInitializer";
import { RouteLoadingScreen } from "@/app/components/RouteLoadingScreen";
import { router } from "@/router";
import { Toaster } from "@/shared/ui/toaster";

export default function App() {
  return (
    <>
      <AuthInitializer>
        <RouterProvider
          router={router}
          fallbackElement={<RouteLoadingScreen />}
        />
      </AuthInitializer>
      <Toaster />
    </>
  );
}
