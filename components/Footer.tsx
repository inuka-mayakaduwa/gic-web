"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

export function Footer() {
    const t = useTranslations('Citizen.Common.Footer')

    return (
        <footer className="border-t bg-card py-6 md:py-8 mt-12 md:mt-20">
            <div className="container mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
                <p>{t('copyright')}</p>
            </div>
        </footer>
    )
}
