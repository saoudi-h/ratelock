import { Slider as SliderPrimitive } from '@base-ui/react/slider'

import { cn } from '@/lib/utils'

function Slider({
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    ...props
}: SliderPrimitive.Root.Props) {
    const _values = Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max]

    return (
        <SliderPrimitive.Root
            className={cn(
                `
                  data-horizontal:w-full
                  data-vertical:h-full
                `,
                className
            )}
            data-slot="slider"
            defaultValue={defaultValue}
            value={value}
            min={min}
            max={max}
            thumbAlignment="edge"
            {...props}>
            <SliderPrimitive.Control
                className="
                  relative flex w-full touch-none items-center select-none
                  data-disabled:opacity-50
                  data-vertical:h-full data-vertical:min-h-40
                  data-vertical:w-auto data-vertical:flex-col
                ">
                <SliderPrimitive.Track
                    data-slot="slider-track"
                    className="
                      relative grow overflow-hidden rounded-full border
                      border-border/60 bg-muted/80 dark:bg-muted-foreground/15
                      shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] select-none
                      data-horizontal:h-2 data-horizontal:w-full
                      data-vertical:h-full data-vertical:w-2
                    ">
                    <SliderPrimitive.Indicator
                        data-slot="slider-range"
                        className="
                          bg-primary select-none
                          data-horizontal:h-full
                          data-vertical:w-full
                        "
                    />
                </SliderPrimitive.Track>
                {Array.from({ length: _values.length }, (_, index) => (
                    <SliderPrimitive.Thumb
                        data-slot="slider-thumb"
                        key={index}
                        className="
                          block size-4.5 shrink-0 rounded-full border
                          border-primary/25 bg-background shadow-xs ring-2
                          ring-primary/10
                          transition-all duration-150
                          hover:scale-110 hover:bg-card hover:ring-primary/20
                          focus-visible:ring-4 focus-visible:ring-ring/25
                          focus-visible:outline-hidden
                          disabled:pointer-events-none disabled:opacity-50
                          cursor-grab active:cursor-grabbing active:scale-95
                          data-vertical:h-4.5 data-vertical:w-4.5
                        "
                    />
                ))}
            </SliderPrimitive.Control>
        </SliderPrimitive.Root>
    )
}

export { Slider }
