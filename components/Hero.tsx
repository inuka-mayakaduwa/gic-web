"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Search,
  Building2,
  Users,
  ScrollText,
  FileText,
  Briefcase,
  Newspaper,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type SearchResults = {
  organizations: Array<{
    id: string
    slug: string
    name: string
    logo: string | null
    categories: Array<{ id: string; name: string }>
    servicesCount: number
  }>
  people: Array<{
    id: string
    name: string
    organizationName: string
    organizationId: string
    slug: string
    departmentNames: string
    designation: string
    image: string | null
    organizationLogo?: string | null
  }>
  services: Array<{
    name: string
    description: string
    slug: string
    organizationName: string
    organizationSlug: string
  }>
  news: Array<{
    title: string
    summary: string
    banner: string | null
    publishedDate: string
    organizations: Array<{ id: string; name: string; slug: string }>
    views: number
    slug: string
  }>
}

export function Hero() {
  const t = useTranslations("Citizen.Landing.Hero")
  const router = useRouter()
  const locale = useLocale()
  const [searchFocused, setSearchFocused] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")
  const [results, setResults] = React.useState<SearchResults | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch()
      } else if (searchQuery.trim().length === 0) {
        setResults(null)
        setHasSearched(false)
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [searchQuery, activeTab])

  const performSearch = async () => {
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({
        language: "en",
        q: searchQuery.trim(),
      })

      const response = await fetch(`/api/citizen/search?${params}`)

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data)

      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } catch (err) {
      setError(t("searchError"))
      console.error("[v0] Search error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().length >= 2) {
      performSearch()
    }
  }

  const handleResultClick = (
    type: "organization" | "person" | "service" | "news",
    slug: string,
    organizationSlug?: string,
  ) => {
    // Get current locale, fallback to 'en' if not available
    const currentLocale = locale || "en"

    if (type === "organization") {
      router.push(`/${currentLocale}/${slug}`)
    } else if (type === "person") {
      // People slug already includes organizationSlug/personSlug format from API
      router.push(`/${currentLocale}/${slug}`)
    } else if (type === "service") {
      // Services slug already includes organizationSlug/serviceSlug format from API
      router.push(`/${currentLocale}/${slug}`)
    } else if (type === "news") {
      // News slug already includes "news/" prefix from API
      router.push(`/${currentLocale}/${slug}`)
    }
  }

  const filteredResults = React.useMemo(() => {
    if (!results) return null

    if (activeTab === "all") {
      return results
    }

    return {
      organizations: activeTab === "organizations" ? results.organizations : [],
      people: activeTab === "people" ? results.people : [],
      services: activeTab === "services" ? results.services : [],
      news: activeTab === "news" ? results.news : [],
    }
  }, [results, activeTab])

  const totalResults = React.useMemo(() => {
    if (!results) return 0
    return results.organizations.length + results.people.length + results.services.length + results.news.length
  }, [results])

  return (
    <section className="min-h-[70vh] md:min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-24 md:pt-20 pb-8 md:pb-10 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div
        className="absolute top-1/4 left-1/4 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse"
        style={{ animationDelay: "1s", animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"
        style={{ animationDelay: "2s", animationDuration: "5s" }}
      />

      <div className="w-full max-w-4xl space-y-6 md:space-y-8">
        <div className="space-y-3 md:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
            {t("title")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-center text-pretty">
            {t("description")}
          </p>
        </div>

        <div
          className={`w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl md:rounded-2xl p-2 md:p-2 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 delay-200 ${
            searchFocused ? "shadow-2xl scale-[1.01] md:scale-[1.02] border-primary/50" : ""
          }`}
        >
          {mounted && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="relative flex items-center group">
                <Search
                  className={`absolute left-3 md:left-4 h-4 md:h-5 w-4 md:w-5 transition-all duration-300 ${
                    searchFocused ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t("searchPlaceholder")}
                  className="h-12 md:h-14 pl-10 md:pl-12 pr-24 md:pr-32 text-base md:text-lg rounded-lg md:rounded-xl border-transparent bg-background shadow-none focus-visible:ring-0 transition-all duration-300"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  disabled={loading}
                />
                <Button
                  onClick={performSearch}
                  disabled={loading || searchQuery.trim().length < 2}
                  className={`absolute right-2 h-8 md:h-10 px-4 md:px-6 text-sm md:text-base rounded-md md:rounded-lg transition-all duration-300 ${
                    searchFocused ? "scale-105 shadow-lg" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="hidden sm:inline">{t("searching")}</span>
                    </>
                  ) : (
                    t("searchButton")
                  )}
                </Button>
              </div>

              <TabsList className="w-full justify-start h-auto flex-wrap gap-1.5 md:gap-2 bg-transparent p-0 px-1 md:px-2 pb-2">
                <TabsTrigger
                  value="all"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-300"
                >
                  {t("tabs.all")}
                </TabsTrigger>
                <TabsTrigger
                  value="organizations"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[350ms]"
                >
                  <Building2 className="h-3 w-3" /> <span className="hidden sm:inline">{t("tabs.organizations")}</span>
                  <span className="sm:hidden">Orgs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="people"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[400ms]"
                >
                  <Users className="h-3 w-3" /> {t("tabs.people")}
                </TabsTrigger>
                <TabsTrigger
                  value="acts"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[450ms]"
                >
                  <ScrollText className="h-3 w-3" /> {t("tabs.acts")}
                </TabsTrigger>
                <TabsTrigger
                  value="gazettes"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[500ms]"
                >
                  <FileText className="h-3 w-3" /> <span className="hidden sm:inline">{t("tabs.gazettes")}</span>
                  <span className="sm:hidden">Docs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[550ms]"
                >
                  <Briefcase className="h-3 w-3" /> <span className="hidden sm:inline">{t("tabs.services")}</span>
                  <span className="sm:hidden">Svcs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  className="rounded-full text-xs md:text-sm border border-border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 md:gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 delay-[600ms]"
                >
                  <Newspaper className="h-3 w-3" /> {t("tabs.news")}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
          )}
        </div>

        {hasSearched && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
              <Card className="p-6 bg-destructive/10 border-destructive/20">
                <p className="text-destructive-foreground">{error}</p>
              </Card>
            )}

            {!loading && !error && filteredResults && totalResults === 0 && (
              <Card className="p-8 bg-muted/30">
                <div className="flex flex-col items-start">
                  <Search className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-foreground mb-2">{t("noResults")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("noResultsDescription")}
                  </p>
                </div>
              </Card>
            )}

            {!loading && !error && filteredResults && totalResults > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-semibold">
                    {t("searchResults")}
                    <span className="text-muted-foreground ml-2">({totalResults})</span>
                  </h2>
                </div>

                {filteredResults.organizations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{t("sections.organizations")}</h3>
                      <Badge variant="secondary">{filteredResults.organizations.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {filteredResults.organizations.map((org) => (
                        <Card
                          key={org.id}
                          onClick={() => handleResultClick("organization", org.slug)}
                          className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            {org.logo ? (
                              <img
                                src={org.logo || "/placeholder.svg"}
                                alt={org.name}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                  {org.name}
                                </h4>
                                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {org.categories.map((cat) => (
                                  <Badge key={cat.id} variant="outline" className="text-xs">
                                    {cat.name}
                                  </Badge>
                                ))}
                                {org.servicesCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {org.servicesCount} {t("servicesCount")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {filteredResults.people.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{t("sections.people")}</h3>
                      <Badge variant="secondary">{filteredResults.people.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {filteredResults.people.map((person) => (
                        <Card
                          key={person.id}
                          onClick={() => handleResultClick("person", person.slug)}
                          className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {person.image ? (
                                <img
                                  src={person.image || "/placeholder.svg"}
                                  alt={person.name}
                                  className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                  {person.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">{person.designation}</p>

                                <div className="flex items-center gap-2 mt-2">
                                  {person.organizationLogo ? (
                                    <img
                                      src={person.organizationLogo || "/placeholder.svg"}
                                      alt={person.organizationName}
                                      className="h-5 w-5 object-contain flex-shrink-0"
                                    />
                                  ) : (
                                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <p className="text-sm text-muted-foreground truncate">{person.organizationName}</p>
                                </div>

                                {person.departmentNames && (
                                  <Badge variant="outline" className="text-xs mt-2">
                                    {person.departmentNames}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {filteredResults.services.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{t("sections.services")}</h3>
                      <Badge variant="secondary">{filteredResults.services.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {filteredResults.services.map((service, idx) => (
                        <Card
                          key={idx}
                          onClick={() => handleResultClick("service", service.slug, service.organizationSlug)}
                          className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                {service.name}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                              <Badge variant="outline" className="text-xs mt-2">
                                {service.organizationName}
                              </Badge>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {filteredResults.news.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{t("sections.news")}</h3>
                      <Badge variant="secondary">{filteredResults.news.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {filteredResults.news.map((newsItem, idx) => (
                        <Card
                          key={idx}
                          onClick={() => handleResultClick("news", newsItem.slug)}
                          className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            {newsItem.banner && (
                              <img
                                src={newsItem.banner || "/placeholder.svg"}
                                alt={newsItem.title}
                                className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                                  {newsItem.title}
                                </h4>
                                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{newsItem.summary}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {newsItem.organizations.slice(0, 2).map((org) => (
                                  <Badge key={org.id} variant="outline" className="text-xs">
                                    {org.name}
                                  </Badge>
                                ))}
                                <Badge variant="secondary" className="text-xs">
                                  {newsItem.views} {t("views")}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
