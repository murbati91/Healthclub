"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 font-semibold"
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4" />
      <span>{language === "ar" ? "EN" : "عربي"}</span>
    </Button>
  );
}
