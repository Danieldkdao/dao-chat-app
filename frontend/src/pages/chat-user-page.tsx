import { ChatUI } from "@/components/chats/chat-ui";
import { HomeNavbar } from "@/components/home/home-navbar";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useParams } from "react-router";

export const ChatUserPage = () => {
  const params = useParams();
  const chatId = params.chatId;

  return (
    <SidebarProvider>
      <HomeSidebar />
      <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
        <HomeNavbar />
        <ChatUI chatId={chatId ?? ""} />
      </div>
    </SidebarProvider>
  );
};
