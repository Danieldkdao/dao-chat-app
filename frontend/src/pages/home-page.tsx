import { HomeNavbar } from "@/components/home/home-navbar";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MessageSquareTextIcon } from "lucide-react";

export const HomePage = () => {
  return (
    <SidebarProvider>
      <HomeSidebar />
      <div className="w-full flex flex-col">
        <HomeNavbar />
        <div className="flex-1 w-full bg-radial from-primary/20 to-background flex items-center justify-center">
          <div className="bg-card border py-6 px-8 rounded-lg flex flex-col items-center gap-2 mx-4">
            <MessageSquareTextIcon className="size-10" />
            <h1 className="text-xl font-medium text-center">
              No chat selected
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Select a user to begin chatting and expand your social group!
            </p>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
