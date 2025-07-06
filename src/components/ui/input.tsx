import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Explicitly destructure known HTML input attributes to avoid forwarding unknown ones
    const {
      accept, alt, autoComplete, autoFocus, capture, checked, crossOrigin, disabled,
      enterKeyHint, form, formAction, formEncType, formMethod, formNoValidate, formTarget,
      height, id, list, max, maxLength, min, minLength, multiple, name, pattern, placeholder,
      readOnly, required, size, src, step, value, defaultValue, width,
      onChange, onInput, onInvalid, onFocus, onBlur, // Add common event handlers if needed
      // Include other relevant standard HTML input attributes here
      ...restProps // Capture any remaining standard props if necessary, but primarily rely on the explicit list
    } = props;

    // Filter out non-standard props if absolutely necessary, though usually not recommended
    // delete restProps.fdprocessedid; // Example - directly removing problematic prop (use cautiously)

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        // Pass only known/standard attributes
        accept={accept} alt={alt} autoComplete={autoComplete} autoFocus={autoFocus} capture={capture} checked={checked} crossOrigin={crossOrigin} disabled={disabled}
        enterKeyHint={enterKeyHint} form={form} formAction={formAction} formEncType={formEncType} formMethod={formMethod} formNoValidate={formNoValidate} formTarget={formTarget}
        height={height} id={id} list={list} max={max} maxLength={maxLength} min={min} minLength={minLength} multiple={multiple} name={name} pattern={pattern} placeholder={placeholder}
        readOnly={readOnly} required={required} size={size} src={src} step={step} value={value} defaultValue={defaultValue} width={width}
        onChange={onChange} onInput={onInput} onInvalid={onInvalid} onFocus={onFocus} onBlur={onBlur}
        {...restProps} // Spread remaining standard props (or remove if being extremely strict)
      />
    )
  }
)
Input.displayName = "Input"

export { Input }