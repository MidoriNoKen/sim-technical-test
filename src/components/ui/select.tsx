"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

interface SelectContentProps extends SelectProps {
  className?: string
}

interface SelectItemProps extends SelectProps {
  value: string
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  const { open, setOpen } = React.useContext(SelectContext)

  return (
    <button
      type="button"
      data-slot="select-trigger"
      data-open={open}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 shadow-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const { open } = React.useContext(SelectContext)

  if (!open) return null

  return (
    <div
      data-slot="select-content"
      className={cn(
        "z-50 w-full min-w-[var(--anchor-width)] rounded-md border border-slate-800 bg-slate-900 text-slate-200 shadow-md",
        className
      )}
      {...props}
    >
      <div data-slot="select-list" className="max-h-72 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export function SelectItem({ value, disabled, children, className, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)

  const handleSelect = () => {
    if (!disabled && onValueChange) {
      onValueChange(value)
      setOpen(false)
    }
  }

  return (
    <div
      data-slot="select-item"
      data-selected={selectedValue === value}
      data-disabled={disabled}
      className={cn(
        "flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm transition-colors focus:bg-slate-800 focus:text-slate-200 data-disabled:pointer-events-none data-disabled:opacity-50",
        selectedValue === value && "bg-slate-800 text-slate-200",
        className
      )}
      onClick={handleSelect}
      {...props}
    >
      <span className="pointer-events-none flex items-center gap-2">
        {selectedValue === value && (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </div>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  
  return (
    <span data-slot="select-value" className="line-clamp-1">
      {value || placeholder}
    </span>
  )
}

export function SelectLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs font-medium text-slate-400", className)}
      {...props}
    />
  )
}

export function SelectGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="select-group" {...props}>
      {children}
    </div>
  )
}
