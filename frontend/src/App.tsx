import { Route, Routes, useLocation, useNavigate } from "react-router";
import { HomePage } from "./pages/home-page";
import { SignInPage } from "./pages/auth/sign-in-page";
import { SignUpPage } from "./pages/auth/sign-up-page";
import { useEffect } from "react";
import { authClient, publicRoutes } from "./lib/auth-client";
import { LoadingState } from "./components/loading-state";
import { ChatUserPage } from "./pages/chat-user-page";
import { socket } from "./config/socket";

function App() {
  const navigate = useNavigate();
  const { data, isPending } = authClient.useSession();
  const location = useLocation();

  useEffect(() => {
    if (isPending) return;
    const pathname = location.pathname;
    if (!data?.user) {
      if (socket.connected) {
        socket.disconnect();
      }
      if (!publicRoutes.includes(pathname)) {
        navigate("/sign-in");
        return;
      }
      return;
    }

    if (publicRoutes.includes(pathname)) {
      navigate("/");
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }
  }, [isPending, data?.user, location.pathname, navigate]);

  if (isPending) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingState
          title="Loading..."
          description="This may take a few minutes"
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/chat/:chatId" element={<ChatUserPage />} />
      </Routes>
    </div>
  );
}

export default App;
