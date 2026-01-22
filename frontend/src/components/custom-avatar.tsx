import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type CustomAvatarProps = {
  name: string;
  imageUrl: string | null | undefined;
  className?: string;
};

export const CustomAvatar = ({
  name,
  imageUrl,
  className,
}: CustomAvatarProps) => {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={imageUrl ?? ""} alt="Avatar" />
      <AvatarFallback>
        {name
          .split(" ")
          .map((part) => {
            if (part.length > 0) {
              return part[0].toUpperCase();
            } else {
              return "";
            }
          })
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
};
