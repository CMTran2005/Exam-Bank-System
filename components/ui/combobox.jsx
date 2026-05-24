import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({
  options = [],
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "Không tìm thấy kết quả.",
  className,
  disabled = false,
  icon: Icon
}) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef(null)

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen)
    if (!newOpen) {
      const selectedOption = options.find((option) => option.value === value)
      if (selectedOption) {
        setInputValue(selectedOption.label)
      } else {
        setInputValue("")
      }
    }
  }

  // Sync internal input value with external value prop
  React.useEffect(() => {
    const selectedOption = options.find((option) => option.value === value)
    if (selectedOption) {
      setInputValue(selectedOption.label)
    } else {
      setInputValue("")
    }
  }, [value, options])

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    if (!open) setOpen(true)
  }

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    
    // If the input value exactly matches the selected option's label, show all options
    // (This happens when an option is selected or when the user clicks the field without changing it)
    const selectedOption = options.find((option) => option.value === value);
    if (selectedOption && inputValue === selectedOption.label) {
        return options;
    }

    return options.filter(option => 
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [options, inputValue, value])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent dark:bg-input/20 px-3 py-2 text-sm ring-offset-background cursor-text",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring",
            "transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => {
            if (!disabled) {
               inputRef.current?.focus();
               setOpen(true);
            }
          }}
        >
          <div className="flex items-center gap-2 w-full overflow-hidden">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
            <input 
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (!open) setOpen(true);
                setInputValue(""); // Clear text to show placeholder
              }}
              disabled={disabled}
            />
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent popover from stealing focus from input
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setInputValue(option.label)
                    setOpen(false)
                    inputRef.current?.blur()
                  }}
                  className="cursor-pointer"
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
