'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ControlFieldProps {
    id: string
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    className?: string
    inputClassName?: string
    type?: 'number' | 'text'
    suffix?: string
}

export function ControlField({
    id,
    label,
    value,
    onChange,
    min,
    max,
    step,
    className,
    inputClassName,
    type = 'number',
    suffix,
}: ControlFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = type === 'number' ? Number(e.target.value) : e.target.value
        onChange(newValue as number)
    }

    return (
        <div className={cn('grid gap-1', className)}>
            <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
                {suffix && ` (${suffix})`}:
            </Label>
            <Input
                id={id}
                type={type}
                className={cn('md:w-28 w-full', inputClassName)}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
            />
        </div>
    )
}
