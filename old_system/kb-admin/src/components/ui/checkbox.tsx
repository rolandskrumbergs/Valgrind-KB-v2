import * as React from "react";

// Define the expected props for the Checkbox component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean | "indeterminate"; // Allow for indeterminate state if needed, though simple boolean is common
  onCheckedChange?: (checked: boolean) => void; // Callback when checked state changes
  // You can add other props specific to your Checkbox component if necessary
  // e.g., label, custom styling props etc.
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, disabled, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    // Basic styling to make it visible and somewhat like a checkbox
    // You can enhance this with more Tailwind classes or custom CSS
    const baseStyle = "h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
    const checkedStyle = checked ? "bg-primary text-primary-foreground" : "bg-transparent";

    // For this mock, we'll render a simple HTML input type="checkbox"
    // and try to simulate some basic behavior and styling.
    // A real shadcn/ui checkbox is more complex with Radix UI primitives.
    return (
      <input
        type="checkbox"
        id={id}
        ref={ref}
        checked={checked === true} // HTML input checked is boolean
        onChange={handleChange}
        disabled={disabled}
        className={`${baseStyle} ${checkedStyle} ${className || ''}`}
        style={{
          // Simple visual cue for the checkmark if not using a more complex SVG/CSS approach
          // This is very basic; a real checkbox would use an SVG or ::after pseudo-element
          appearance: 'none', // Remove default browser styling to apply custom one
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...props}
      />
      // If you want a visual checkmark (very simplified):
      // You might need to wrap this input and add a sibling span or SVG for the checkmark icon
      // For a pure mock, the above is often sufficient.
      // Example for a visual check (add this inside the return if you wrap the input):
      // {checked === true && (
      //   <span style={{
      //     position: 'absolute',
      //     top: '50%',
      //     left: '50%',
      //     transform: 'translate(-50%, -50%)',
      //     color: 'white', // Assuming dark background for checked state
      //     fontSize: '0.75rem',
      //     lineHeight: '1',
      //   }}>
      //     ✓
      //   </span>
      // )}
    );
  }
);
Checkbox.displayName = "Checkbox"; // Standard practice for forwardRef components

export { Checkbox };