
import AppRoutes from "./routes/AppRouter";
import "./assets/styles.css";
import { useAuthStore } from "./stores/useAuthStore";
import { useRefreshToken } from "./hooks/useAuth";
import { useEffect } from "react";

export default function App() {
  const { accessToken } = useAuthStore();
  const refreshTokenMutation = useRefreshToken();

  useEffect(() => {
    // Nếu chưa có accessToken (do F5 hoặc mới vào), thử refresh xem có cookie không
    if (!accessToken) {
       refreshTokenMutation.mutate(undefined, {
         onSuccess: () => {
           console.log("Re-login via Cookie successful!");
         },
         onError: () => {
           console.log("No valid session found.");
         }
       });
    }
  }, []); // Chạy 1 lần khi mount

  if (refreshTokenMutation.isPending && !accessToken) {
     return <div>Loading session...</div>; // Màn hình chờ để tránh chớp màn hình Login
  }
  return <AppRoutes />;
}
