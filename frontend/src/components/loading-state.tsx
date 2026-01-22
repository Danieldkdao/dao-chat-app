import { Loader2Icon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

type LoadingStateProps = {
  title: string;
  description: string;
};

export const LoadingState = ({ title, description }: LoadingStateProps) => {
  return (
    <Card className="flex flex-col items-center">
      <Loader2Icon className="text-primary size-6 animate-spin" />
      <CardContent className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};
