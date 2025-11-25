"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search, Building2, Users, ScrollText, FileText, Briefcase, Newspaper } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function Hero() {
    const t = useTranslations('Citizen.Landing.Hero')
    const [searchFocused, setSearchFocused] = React.useState(false)

    return (
        <section className="min-h-[70vh] md:min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-24 md:pt-20 pb-8 md:pb-10 relative overflow-hidden">
            {/* Animated Background Gradient Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />

            <div className="w-full max-w-4xl space-y-6 md:space-y-8 text-center">
                {/* Animated Title Section */}
                <div className="space-y-2 md:space-y-3">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 px-2">
                        {t('title')}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 px-4">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Animated Search Box */}
                <div className={`w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl md:rounded-2xl p-2 md:p-2 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 delay-200 ${searchFocused ? 'shadow-2xl scale-[1.01] md:scale-[1.02] border-primary/50' : ''
                    }`}>
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex flex-col gap-3 md:gap-4">
                            {/* Search Input with Focus Animation */}
                            <div className="relative flex items-center group">
                                <Search className={`absolute left-3 md:left-4 h-4 md:h-5 w-4 md:w-5 transition-all duration-300 ${searchFocused ? 'text-primary scale-110' : 'text-muted-foreground'
                                    }`} />
                                <Input
                                    placeholder={t('searchPlaceholder')}
                                    className="h-12 md:h-14 pl-10 md:pl-12 pr-24 md:pr-32 text-base md:text-lg rounded-lg md:rounded-xl border-transparent bg-background shadow-none focus-visible:ring-0 transition-all duration-300"
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                                <Button className={`absolute right-2 h-8 md:h-10 px-4 md:px-6 text-sm md:text-base rounded-md md:rounded-lg transition-all duration-300 ${searchFocused ? 'scale-105 shadow-lg' : ''
                                    }`}>
                                    {t('searchButton')}
                                </Button>
                            </div>

                            {/* Animated Tabs */}
                            <TabsList className="w-full justify-start h-auto flex-wrap gap-1.5 md:gap-2 bg-transparent p-0 px-1 md:px-2 pb-2">
                                <TabsTrigger
                                    value="all"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-300"
                                >
                                    {t('tabs.all')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="organizations"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[350ms]"
                                >
                                    <Building2 className="h-3 w-3" /> <span className="hidden sm:inline">{t('tabs.organizations')}</span><span className="sm:hidden">Orgs</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="people"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[400ms]"
                                >
                                    <Users className="h-3 w-3" /> {t('tabs.people')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="acts"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[450ms]"
                                >
                                    <ScrollText className="h-3 w-3" /> {t('tabs.acts')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="gazettes"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[500ms]"
                                >
                                    <FileText className="h-3 w-3" /> <span className="hidden sm:inline">{t('tabs.gazettes')}</span><span className="sm:hidden">Docs</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="services"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[550ms]"
                                >
                                    <Briefcase className="h-3 w-3" /> <span className="hidden sm:inline">{t('tabs.services')}</span><span className="sm:hidden">Svcs</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="news"
                                    className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[600ms]"
                                >
                                    <Newspaper className="h-3 w-3" /> {t('tabs.news')}
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </Tabs>
                </div>
            </div>
        </section>
    )
}
