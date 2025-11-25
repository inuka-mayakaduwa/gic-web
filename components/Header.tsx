// src/components/Header.tsx
"use client"

import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"

export default function Header() {
    const t = useTranslations("Citizen.Common.Header")
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    // Function to switch language
    const switchLanguage = (newLocale: string) => {
        // Strip off the existing locale prefix
        const segments = pathname.split("/")
        segments.splice(0, 2)
        const pathWithoutLocale = segments.length > 0 ? `/${segments.join("/")}` : ""
        router.push(`/${newLocale}${pathWithoutLocale}`)
    }

    // Helper to build button classes
    const langButtonClass = (lang: string) =>
        `h-5 md:h-6 px-1.5 md:px-2 text-[10px] md:text-xs font-medium hover:bg-accent/80 dark:hover:bg-accent/50 transition-colors ${locale === lang ? "font-bold underline underline-offset-2" : ""
        }`

    return (
        <div className="w-full bg-muted/30 dark:bg-muted/20 border-b border-border py-0.5 md:py-1 mb-6 md:mb-8">
            <div className="container mx-auto px-3 md:px-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1.5 md:space-x-2">
                        {/* Sri Lanka Flag */}
                        <Image
                            src="/sl-flag.svg"
                            alt="Sri Lanka Flag"
                            width={20}
                            height={12}
                            className="h-3 md:h-4 w-auto"
                        />
                        <span className="text-[10px] md:text-xs text-muted-foreground">{t("GovWebDeclare")}</span>
                    </div>
                    <div className="flex items-center space-x-0.5 md:space-x-1">
                        {/* Language Switch Buttons */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={langButtonClass("si")}
                            onClick={() => switchLanguage("si")}
                        >
                            සිංහල
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={langButtonClass("en")}
                            onClick={() => switchLanguage("en")}
                        >
                            English
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={langButtonClass("ta")}
                            onClick={() => switchLanguage("ta")}
                        >
                            தமிழ்
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
