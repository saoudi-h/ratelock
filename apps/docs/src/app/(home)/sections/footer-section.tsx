'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'

export function FooterSection() {
    return (
        <footer className="relative border-t border-border/40 bg-muted/20">
            <div className="mx-auto max-w-7xl px-6 py-16">
                <div className="
                  grid grid-cols-1 items-start gap-10
                  md:grid-cols-4
                 border-b border-border/20 pb-12">
                    {/* Brand column */}
                    <div className="space-y-4 md:col-span-2">
                        <div className="flex items-center gap-2.5 select-none">
                            <span className="
                              flex size-7 items-center justify-center rounded-xl
                              bg-primary font-heading text-sm font-black
                              text-background
                            ">R</span>
                            <h3 className="
                              font-heading text-lg font-bold tracking-tight
                            ">
                                RateLock
                            </h3>
                        </div>
                        <p className="
                          max-w-sm text-xs/relaxed text-muted-foreground
                        ">
                            A highly precise, resilient rate limiting suite for TypeScript. Built to scale gracefully with your local storage, Redis, or PostgreSQL backends.
                        </p>
                    </div>

                    {/* Documentation Links column */}
                    <div className="space-y-4">
                        <div className="
                          text-[10px] font-bold tracking-widest
                          text-muted-foreground/60 uppercase select-none
                        ">Documentation</div>
                        <ul className="flex flex-col gap-3 text-xs">
                            <li>
                                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors duration-155">
                                    Getting Started
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/strategies" className="text-muted-foreground hover:text-foreground transition-colors duration-155">
                                    Rate Limiting Strategies
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/engines" className="text-muted-foreground hover:text-foreground transition-colors duration-155">
                                    Storage Engines
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/policies" className="text-muted-foreground hover:text-foreground transition-colors duration-155">
                                    Resilience Policies
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* NPM Packages Links column */}
                    <div className="space-y-4">
                        <div className="
                          text-[10px] font-bold tracking-widest
                          text-muted-foreground/60 uppercase select-none
                        ">NPM Packages</div>
                        <ul className="flex flex-col gap-3 text-xs font-mono">
                            <li>
                                <a 
                                    href="https://www.npmjs.com/package/@ratelock/local"
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-155"
                                >
                                    <Icon icon="logos:npm-icon" className="size-3.5" />
                                    <span>@ratelock/local</span>
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://www.npmjs.com/package/@ratelock/redis"
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-155"
                                >
                                    <Icon icon="logos:npm-icon" className="size-3.5" />
                                    <span>@ratelock/redis</span>
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://www.npmjs.com/package/@ratelock/postgres"
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-155"
                                >
                                    <Icon icon="logos:npm-icon" className="size-3.5" />
                                    <span>@ratelock/postgres</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Subfooter info */}
                <div className="
                  mt-8 flex flex-col items-start justify-between gap-4 text-[11px]
                  text-muted-foreground select-none
                  md:flex-row md:items-center
                ">
                    <div className="flex items-center gap-2">
                        <span>MIT License • Copyright © {new Date().getFullYear()} Hakim Saoudi</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/saoudi-h/ratelock"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-155"
                        >
                            <Icon icon="mdi:github" className="size-4" />
                            <span>GitHub</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
