"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const languages = [
  { code: "en", name: "English" },
  { code: "si", name: "සිංහල" },
  { code: "ta", name: "தமிழ்" },
];

function LanguageSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectPath = searchParams.get("redirect") || "";

  const handleLanguageSelect = (locale: string) => {
    // Build the redirect URL with locale prefix
    const path = redirectPath ? `/${locale}/${redirectPath}` : `/${locale}`;
    router.push(path);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select Language</CardTitle>
          <CardDescription>
            {redirectPath
              ? `Please select your preferred language to continue to ${redirectPath}`
              : "Please select your preferred language"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className="w-full h-14 text-lg"
              variant="outline"
            >
              {lang.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

export default function LanguageSelectionPage() {
  return (
    <Suspense>
      <LanguageSelectionContent />
    </Suspense>
  );
}

