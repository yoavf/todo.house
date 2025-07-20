'use client';

interface DatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  minDate?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ 
  value, 
  onChange, 
  minDate, 
  placeholder = "Select date",
  className = "" 
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || undefined);
  };

  const today = new Date().toISOString().split('T')[0];
  const effectiveMinDate = minDate || today;

  return (
    <input
      type="datetime-local"
      value={value || ''}
      onChange={handleChange}
      min={effectiveMinDate}
      placeholder={placeholder}
      className={`px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}