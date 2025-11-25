"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CloudSun, Train, Zap, ArrowRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const t = useTranslations('Citizen.Common.Sidebar')
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [expandedCard, setExpandedCard] = React.useState<string | null>(null)

    React.useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 100
            setIsScrolled(scrolled)
            // Auto-collapse when scrolled
            if (scrolled && !isCollapsed) {
                setIsCollapsed(true)
                setExpandedCard(null)
            }
            // Auto-expand when at top
            if (!scrolled && isCollapsed) {
                setIsCollapsed(false)
            }
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isCollapsed])

    const handleCardClick = (cardId: string) => {
        if (!isScrolled) return // Don't allow interaction when not scrolled

        if (isCollapsed) {
            // If collapsed, expand sidebar and show this card
            setIsCollapsed(false)
            setExpandedCard(cardId)
        } else {
            // If expanded, toggle the card
            setExpandedCard(expandedCard === cardId ? null : cardId)
        }
    }

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed)
        if (!isCollapsed) {
            setExpandedCard(null)
        }
    }

    const isCardExpanded = (cardId: string) => {
        if (!isScrolled) return true // Always expanded when at top
        if (isCollapsed) return false // Never expanded when collapsed
        return expandedCard === cardId || expandedCard === null // Show all or specific card
    }

    return (
        <aside
            className={`hidden xl:flex fixed top-28 right-8 z-40 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-96'
                }`}
            style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
            <div className="flex flex-col w-full gap-3">
                {/* Toggle Button */}
                {isScrolled && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleSidebar}
                        className={`self-end bg-background/95 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 ${isCollapsed ? 'w-16 h-16 rounded-2xl' : 'w-12 h-12 rounded-xl'
                            }`}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <ChevronsLeft className="h-5 w-5" />
                        ) : (
                            <ChevronsRight className="h-5 w-5" />
                        )}
                    </Button>
                )}

                {/* Cards Container */}
                <div className={`flex flex-col gap-3 overflow-y-auto pr-1 ${isScrolled ? 'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent' : ''
                    }`}>
                    {/* Weather Card */}
                    <Card
                        className={`group bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 ${isScrolled ? 'cursor-pointer hover:border-accent/50' : ''
                            } ${isCollapsed ? 'w-16 h-16 p-0' : ''}`}
                        onClick={() => handleCardClick('weather')}
                    >
                        {isCollapsed ? (
                            <div className="h-full flex items-center justify-center">
                                <CloudSun className="h-7 w-7 text-accent" />
                            </div>
                        ) : (
                            <>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent/10">
                                            <CloudSun className="h-5 w-5 text-accent" />
                                        </div>
                                        <span>{t('weather')}</span>
                                    </CardTitle>
                                </CardHeader>
                                {isCardExpanded('weather') && (
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-4xl font-bold tracking-tight">28°C</div>
                                                <div className="text-sm text-muted-foreground mt-1">Partly Cloudy</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium">Colombo</div>
                                                <div className="text-xs text-muted-foreground mt-1">Updated now</div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between text-sm h-9 text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            {t('exploreMore')}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Train Card */}
                    <Card
                        className={`group bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 ${isScrolled ? 'cursor-pointer hover:border-primary/50' : ''
                            } ${isCollapsed ? 'w-16 h-16 p-0' : ''}`}
                        onClick={() => handleCardClick('trains')}
                    >
                        {isCollapsed ? (
                            <div className="h-full flex items-center justify-center">
                                <Train className="h-7 w-7 text-primary" />
                            </div>
                        ) : (
                            <>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Train className="h-5 w-5 text-primary" />
                                        </div>
                                        <span>{t('trains')}</span>
                                    </CardTitle>
                                </CardHeader>
                                {isCardExpanded('trains') && (
                                    <CardContent className="space-y-3">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                                <span className="text-sm font-medium">Colombo Fort - Kandy</span>
                                                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                                    On Time
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                                <span className="text-sm font-medium">Maradana - Galle</span>
                                                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                    +10m
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between text-sm h-9 text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            {t('exploreMore')}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Outages Card */}
                    <Card
                        className={`group bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 ${isScrolled ? 'cursor-pointer hover:border-destructive/50' : ''
                            } ${isCollapsed ? 'w-16 h-16 p-0' : ''}`}
                        onClick={() => handleCardClick('outages')}
                    >
                        {isCollapsed ? (
                            <div className="h-full flex items-center justify-center">
                                <Zap className="h-7 w-7 text-destructive" />
                            </div>
                        ) : (
                            <>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-destructive/10">
                                            <Zap className="h-5 w-5 text-destructive" />
                                        </div>
                                        <span>{t('outages')}</span>
                                    </CardTitle>
                                </CardHeader>
                                {isCardExpanded('outages') && (
                                    <CardContent className="space-y-3">
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-start gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    No major power outages reported in your area.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between text-sm h-9 text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            {t('exploreMore')}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </aside>
    )
}
