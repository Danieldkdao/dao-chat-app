import { Card } from "../ui/card";
import Logo from "@/assets/assets";

export const AuthScreen = () => {
  return (
    <Card className="w-full hidden rounded-l-none h-full md:flex items-center justify-center bg-radial from-primary to-primary/40">
      <div>
        <img src={Logo} alt="Logo" className="size-24" />
        <h1 className="text-2xl font-medium">DaoChat</h1>
      </div>
    </Card>
  );
};
