'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function AnimatedHeading({
    children,
    className,
    delay = 0,
}: {
    children: string
    className?: string
    delay?: number
}) {
    const words = children.split(' ')
    const [visibleCount, setVisibleCount] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisibleCount(words.length)
        }, delay)
        return () => clearTimeout(timer)
    }, [words.length, delay])

    return (
        <span className={className}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: i < visibleCount ? 1 : 0,
                        y: i < visibleCount ? 0 : 20,
                    }}
                    transition={{
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: i * 0.08,
                    }}
                    className="mr-[0.25em] inline-block">
                    {word}
                </motion.span>
            ))}
        </span>
    )
}
