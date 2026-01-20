import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateInputProps {
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  className?: string;
}

const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
  ({ className, value, onChange, placeholder = 'DD/MM/AAAA' }, ref) => {
    const parseDate = (dateString: string): Date | undefined => {
      if (!dateString) return undefined;
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const [date, setDate] = React.useState<Date | undefined>(value ? parseDate(value) : undefined);

    React.useEffect(() => {
      if (value) {
        setDate(parseDate(value));
      } else {
        setDate(undefined);
      }
    }, [value]);

    const handleSelect = (selectedDate: Date | undefined) => {
      setDate(selectedDate);
      if (onChange && selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        onChange({ target: { value: formattedDate } });
      } else if (onChange && !selectedDate) {
        onChange({ target: { value: '' } });
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-xl border-0 fill-primary px-4 py-3 text-base text-[#2C2C2C] cursor-pointer items-center justify-between',
              !date && 'text-[#2C2C2C]/60',
              className,
            )}
          >
            <span>{date ? format(date, 'dd/MM/yyyy', { locale: es }) : placeholder}</span>
            <ChevronDown className="w-5 h-5 text-[#2C2C2C]/60" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-lg" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            className="rounded-xl border-0"
            selected={date}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DateInput.displayName = 'DateInput';

export { DateInput };
