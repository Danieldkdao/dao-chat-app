import { CircleXIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

type ErrorState = {
  title: string;
  description: string;
};

export const ErrorState = ({ title, description }: ErrorState) => {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 items-center justify-center">
          <CircleXIcon className="size-6" />
          <h1 className="text-lg font-medium">{title}</h1>
          <p className="text-center text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
