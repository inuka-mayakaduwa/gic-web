"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search, Building2, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function Organizations() {
    const t = useTranslations('Citizen.Landing.Organizations')

    return (
        <section className="py-12 px-4 max-w-4xl mx-auto" id="organizations">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">{t('title')}</h2>
                <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        className="pl-10 h-10 rounded-full"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="hover:border-primary/50 transition-colors group">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold group-hover:text-primary transition-colors">Department of Immigration and Emigration</h3>
                                    <p className="text-sm text-muted-foreground">Ministry of Defense</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
