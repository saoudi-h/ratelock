'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'

export function FooterSection() {
    return (
        <footer className="relative border-t border-border/60 bg-muted/30">
            <div className="mx-auto max-w-7xl px-6 py-16">
                <div className="
                  grid grid-cols-1 items-start gap-8
                  md:grid-cols-3
                ">
                    {/* Brand Tile */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 select-none">
                            <span className="
                              flex size-6 items-center justify-center rounded-md
                              bg-primary font-heading text-xs font-black
                              text-background
                            ">R</span>
                            <h3 className="
                              font-heading text-lg font-bold tracking-tight
                            ">
                                RateLock
                            </h3>
                        </div>
                        <p className="
                          max-w-xs text-xs/relaxed text-muted-foreground
                        ">
                            A high-performance, resilient, and fully type-safe rate limiting suite crafted with care.
                        </p>
                    </div>

                    {/* Navigation Links Grid */}
                    <div className="
                      flex flex-wrap gap-x-12 gap-y-6 text-xs
                      md:col-span-2 md:justify-end
                    ">
                        <div className="space-y-3">
                            <div className="
                              text-[9px] font-bold tracking-wider
                              text-muted-foreground/60 uppercase select-none
                            ">Resources</div>
                            <div className="flex flex-col gap-2.5">
                                <Link
                                    href="/docs"
                                    className="
                                      flex items-center gap-2
                                      text-muted-foreground transition-all
                                      duration-150
                                      hover:text-foreground
                                      active:scale-[0.97]
                                    "
                                >
                                    <Icon icon="lucide:book-open" className="
                                      size-3.5
                                    " />
                                    Documentation
                                </Link>
                                <a
                                    href="https://github.com/saoudi-h/ratelock"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                      flex items-center gap-2
                                      text-muted-foreground transition-all
                                      duration-150
                                      hover:text-foreground
                                      active:scale-[0.97]
                                    "
                                >
                                    <Icon icon="mdi:github" className="size-3.5" />
                                    GitHub
                                </a>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="
                              text-[9px] font-bold tracking-wider
                              text-muted-foreground/60 uppercase select-none
                            ">Ecosystem</div>
                            <div className="flex flex-col gap-2.5 font-mono">
                                <span className="
                                  w-fit rounded-md border border-border/40
                                  bg-muted/65 px-2 py-0.5 text-[10px]
                                  text-muted-foreground/75 select-none
                                ">@ratelock/core</span>
                                <span className="
                                  w-fit rounded-md border border-border/40
                                  bg-muted/65 px-2 py-0.5 text-[10px]
                                  text-muted-foreground/75 select-none
                                ">@ratelock/redis</span>
                                <span className="
                                  w-fit rounded-md border border-border/40
                                  bg-muted/65 px-2 py-0.5 text-[10px]
                                  text-muted-foreground/75 select-none
                                ">@ratelock/postgres</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subfooter info */}
                <div className="
                  mt-12 flex flex-col items-start justify-between gap-4 border-t
                  border-border/40 pt-8 text-[11px] leading-normal
                  text-muted-foreground select-none
                  md:flex-row md:items-center
                ">
                    <div className="flex items-center gap-2">
                        <span>MIT License • Copyright © {new Date().getFullYear()} Hakim Saoudi</span>
                    </div>
                    <div className="
                      flex items-center gap-1.5 font-mono text-[10px]
                    ">
                        <span>Built with care</span>
                        <Icon icon="lucide:heart" className="
                          size-3 fill-red-500 text-red-500
                        " />
                        <span>for Node.js & Bun</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
