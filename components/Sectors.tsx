"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

const sectors = [
    {
        id: "education",
        image: "/sector_education_1764042033285.png",
        color: "from-blue-500/20 to-blue-600/20",
        borderColor: "border-blue-500/30 hover:border-blue-500/60"
    },
    {
        id: "health",
        image: "/sector_health_1764042048336.png",
        color: "from-red-500/20 to-red-600/20",
        borderColor: "border-red-500/30 hover:border-red-500/60"
    },
    {
        id: "finance",
        image: "/sector_finance_1764042061914.png",
        color: "from-yellow-500/20 to-yellow-600/20",
        borderColor: "border-yellow-500/30 hover:border-yellow-500/60"
    },
    {
        id: "agriculture",
        image: "/sector_agriculture_1764042075647.png",
        color: "from-green-500/20 to-green-600/20",
        borderColor: "border-green-500/30 hover:border-green-500/60"
    },
    {
        id: "transport",
        image: "/sector_transport_1764042114737.png",
        color: "from-purple-500/20 to-purple-600/20",
        borderColor: "border-purple-500/30 hover:border-purple-500/60"
    },
    {
        id: "justice",
        image: "/sector_justice_1764042139992.png",
        color: "from-slate-500/20 to-slate-600/20",
        borderColor: "border-slate-500/30 hover:border-slate-500/60"
    },
    {
        id: "administration",
        image: "/sector_administration_1764042153588.png",
        color: "from-teal-500/20 to-teal-600/20",
        borderColor: "border-teal-500/30 hover:border-teal-500/60"
    },
    {
        id: "media",
        image: "/sector_media.svg",
        color: "from-orange-500/20 to-orange-600/20",
        borderColor: "border-orange-500/30 hover:border-orange-500/60"
    },
    {
        id: "environment",
        image: "/sector_environment.svg",
        color: "from-emerald-500/20 to-emerald-600/20",
        borderColor: "border-emerald-500/30 hover:border-emerald-500/60"
    },
]

export function Sectors() {
    const t = useTranslations('Citizen.Landing.Sectors')
    const [expandedSector, setExpandedSector] = React.useState<string | null>(null)

    return (
        <section className="py-12 md:py-16 px-4 sm:px-6 max-w-7xl mx-auto" id="sectors">
            <div className="text-center mb-10 md:mb-14">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('title')}</h2>
                <p className="text-muted-foreground text-base md:text-lg">{t('description')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {sectors.map((sector) => {
                    const rawData = t.raw(sector.id)
                    // Handle both string and object formats from translations
                    const sectorData = typeof rawData === 'string' 
                        ? { name: rawData, subPoints: [] as string[] }
                        : (rawData as { name?: string; subPoints?: string[] }) || { name: sector.id, subPoints: [] }
                    
                    const sectorName = sectorData.name || sector.id
                    const subPoints = sectorData.subPoints || []
                    const isExpanded = expandedSector === sector.id

                    return (
                        <Card
                            key={sector.id}
                            className={`group cursor-pointer transition-all duration-300 border-2 ${sector.borderColor} hover:shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden ${isExpanded ? 'ring-2 ring-primary/50' : ''
                                }`}
                            onClick={() => setExpandedSector(isExpanded ? null : sector.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-4">
                                    {/* Sector Image/Icon */}
                                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${sector.color}`}>
                                        <Image
                                            src={sector.image}
                                            alt={sectorName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Sector Name */}
                                    <div className="flex-1">
                                        <CardTitle className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">
                                            {sectorName}
                                        </CardTitle>
                                        {subPoints.length > 0 && (
                                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                                {subPoints.length} {t('services')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Expand Icon */}
                                    <ChevronRight
                                        className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''
                                            }`}
                                    />
                                </div>
                            </CardHeader>

                            {/* Sub-points - Expandable */}
                            {isExpanded && subPoints.length > 0 && (
                                <CardContent className="pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="border-t border-border/50 pt-4">
                                        <ul className="grid grid-cols-2 gap-2">
                                            {subPoints.map((point, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50"
                                                >
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )
                })}
            </div>
        </section>
    )
}
