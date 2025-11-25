"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CloudSun, Train, Zap, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function LiveData() {
    const t = useTranslations('Citizen.Common.Sidebar')

    return (
        <section className="py-16 px-4 bg-muted/30" id="live-data">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">Live Data</h2>
                    <p className="text-muted-foreground text-lg">Real-time information at your fingertips</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Weather Card */}
                    <Card className="group bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-accent/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                                    <CloudSun className="h-6 w-6 text-accent" />
                                </div>
                                <span>{t('weather')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-5xl font-bold tracking-tight">28°C</div>
                                    <div className="text-sm text-muted-foreground mt-2">Partly Cloudy</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-base font-medium">Colombo</div>
                                    <div className="text-xs text-muted-foreground mt-1">Updated now</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm h-10 text-primary hover:text-primary hover:bg-primary/10 group-hover:bg-primary/10"
                            >
                                {t('exploreMore')}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Train Card */}
                    <Card className="group bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Train className="h-6 w-6 text-primary" />
                                </div>
                                <span>{t('trains')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <span className="text-sm font-medium">Colombo Fort - Kandy</span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                        On Time
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <span className="text-sm font-medium">Maradana - Galle</span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        +10m
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm h-10 text-primary hover:text-primary hover:bg-primary/10 group-hover:bg-primary/10"
                            >
                                {t('exploreMore')}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Outages Card */}
                    <Card className="group bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-destructive/50 md:col-span-2 lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                                    <Zap className="h-6 w-6 text-destructive" />
                                </div>
                                <span>{t('outages')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0 animate-pulse" />
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        No major power outages reported in your area.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm h-10 text-primary hover:text-primary hover:bg-primary/10 group-hover:bg-primary/10"
                            >
                                {t('exploreMore')}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
