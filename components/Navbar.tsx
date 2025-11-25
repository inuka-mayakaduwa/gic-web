"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Moon, Sun, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function Navbar() {
    const t = useTranslations('Citizen.Common.Navbar')
    const { setTheme, theme } = useTheme()
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="fixed top-8 md:top-12 left-0 right-0 z-50 flex justify-center px-3 md:px-4">
            <nav
                className={`
          flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3 rounded-full transition-all duration-300
          ${isScrolled
                        ? "bg-background/80 backdrop-blur-md shadow-lg border border-border w-full max-w-5xl"
                        : "bg-transparent w-full max-w-6xl"}
        `}
            >
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm md:text-base">
                        GIC
                    </div>
                    <span className={`font-bold text-base md:text-lg ${isScrolled ? "opacity-100" : "opacity-0 md:opacity-100"} transition-opacity`}>
                        1919
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6">
                    <Link href="#organizations" className="text-sm font-medium hover:text-primary transition-colors">
                        {t('organizations')}
                    </Link>
                    <Link href="#services" className="text-sm font-medium hover:text-primary transition-colors">
                        {t('services')}
                    </Link>
                    <Link href="#forms" className="text-sm font-medium hover:text-primary transition-colors">
                        {t('forms')}
                    </Link>
                    <Link href="#news" className="text-sm font-medium hover:text-primary transition-colors">
                        {t('news')}
                    </Link>
                    <Link href="#help" className="text-sm font-medium hover:text-primary transition-colors">
                        {t('help')}
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                        className="rounded-full h-8 w-8 md:h-10 md:w-10"
                    >
                        <Sun className="h-[1.1rem] w-[1.1rem] md:h-[1.2rem] md:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.1rem] w-[1.1rem] md:h-[1.2rem] md:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden rounded-full h-8 w-8"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-3 right-3 mt-2 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-col gap-3">
                        <Link
                            href="#organizations"
                            className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('organizations')}
                        </Link>
                        <Link
                            href="#services"
                            className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('services')}
                        </Link>
                        <Link
                            href="#forms"
                            className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('forms')}
                        </Link>
                        <Link
                            href="#news"
                            className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('news')}
                        </Link>
                        <Link
                            href="#help"
                            className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('help')}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
