"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, setHours, setMinutes, isValid } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import "react-day-picker/style.css";

interface DateTimePickerProps {
  value: string; // ISO string or "YYYY-MM-DDTHH:mm" format
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  includeTime?: boolean; // default true
  minDate?: Date;
  placeholder?: string;
}

// Generate time options in 30-min increments
function generateTimeOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const label = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      options.push({ label, value });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function DateTimePicker({
  value,
  onChange,
  required = false,
  includeTime = true,
  minDate,
  placeholder,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse incoming value
  useEffect(() => {
    if (!value) {
      setSelectedDate(undefined);
      return;
    }
    let parsed: Date | undefined;
    if (value.includes("T")) {
      parsed = new Date(value);
    } else {
      parsed = parse(value, "yyyy-MM-dd", new Date());
    }
    if (parsed && isValid(parsed)) {
      setSelectedDate(parsed);
      if (includeTime) {
        const h = parsed.getHours().toString().padStart(2, "0");
        const m = parsed.getMinutes().toString().padStart(2, "0");
        setSelectedTime(`${h}:${m}`);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const emitChange = (date: Date | undefined, time: string) => {
    if (!date) {
      onChange("");
      return;
    }
    if (includeTime) {
      const [h, m] = time.split(":").map(Number);
      const combined = setMinutes(setHours(date, h), m);
      onChange(format(combined, "yyyy-MM-dd'T'HH:mm"));
    } else {
      onChange(format(date, "yyyy-MM-dd"));
    }
  };

  const handleDaySelect = (day: Date | undefined) => {
    setSelectedDate(day);
    emitChange(day, selectedTime);
    // Auto-close if date-only mode
    if (!includeTime) {
      setOpen(false);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    emitChange(selectedDate, time);
  };

  // Format the display text for the trigger button
  const getDisplayText = () => {
    if (!selectedDate) return placeholder || (includeTime ? "Pick date & time" : "Pick a date");
    const dateStr = format(selectedDate, "MMM d, yyyy");
    if (!includeTime) return dateStr;
    const timeLabel = TIME_OPTIONS.find((t) => t.value === selectedTime)?.label || selectedTime;
    return `${dateStr} at ${timeLabel}`;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm transition-colors ${
          open
            ? "border-orange-400 ring-2 ring-orange-100"
            : "border-input hover:border-zinc-400"
        } ${!selectedDate ? "text-muted-foreground" : "text-foreground"}`}
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          {getDisplayText()}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Hidden input for form validation */}
      {required && <input type="hidden" value={value || ""} required />}

      {/* Popover dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg">
          <style>{`
            .rdp-dab .rdp-month_caption { font-weight: 600; font-size: 0.875rem; }
            .rdp-dab .rdp-day { border-radius: 0.375rem; }
            .rdp-dab .rdp-day:hover { background: #fff7ed; }
            .rdp-dab .rdp-selected .rdp-day_button,
            .rdp-dab .rdp-day_button.rdp-selected { background: #ea580c !important; color: white !important; border-radius: 0.375rem; font-weight: 600; }
            .rdp-dab .rdp-selected:hover .rdp-day_button { background: #c2410c !important; }
            .rdp-dab .rdp-today:not(.rdp-selected) .rdp-day_button { color: #ea580c; font-weight: 700; }
            .rdp-dab .rdp-disabled .rdp-day_button { color: #d4d4d8; cursor: not-allowed; }
            .rdp-dab .rdp-disabled:hover { background: transparent; }
            .rdp-dab .rdp-chevron { fill: #71717a; }
            .rdp-dab { --rdp-accent-color: #ea580c; --rdp-accent-background-color: #fff7ed; }
          `}</style>

          <div className="p-2">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              disabled={minDate ? { before: minDate } : undefined}
              className="rdp-dab"
            />
          </div>

          {/* Time selector inside popover */}
          {includeTime && selectedDate && (
            <div className="border-t border-zinc-100 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-500 shrink-0">Time:</label>
                <select
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 rounded-md bg-orange-600 px-3 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Date-only picker (no time) — for availability windows
 */
export function DatePicker({
  value,
  onChange,
  required = false,
  minDate,
  placeholder,
}: Omit<DateTimePickerProps, "includeTime">) {
  return (
    <DateTimePicker
      value={value}
      onChange={onChange}
      required={required}
      includeTime={false}
      minDate={minDate}
      placeholder={placeholder}
    />
  );
}
