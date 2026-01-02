import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

interface PackageCardProps {
  name: string;
  description: string;
  features: string[];
  onSubscribe?: () => void;
}

export function PackageCard({
  name,
  description,
  features,
  onSubscribe,
}: PackageCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative w-full h-48 bg-secondary/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">🥗</div>
            <p className="text-sm text-muted-foreground">{name} Package</p>
          </div>
        </div>
        {/* Offer Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="default" className="bg-primary">
            Offer
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          onClick={onSubscribe}
        >
          Subscribe Now
        </Button>
      </CardFooter>
    </Card>
  );
}
