"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, setHours, setMinutes, isValid } from "date-fns";
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

// Common time presets for quick selection
const QUICK_TIMES = [
  { label: "6:00 PM", value: "18:00" },
  { label: "7:00 PM", value: "19:00" },
  { label: "7:30 PM", value: "19:30" },
  { label: "8:00 PM", value: "20:00" },
  { label: "9:00 PM", value: "21:00" },
];

export function DateTimePicker({
  value,
  onChange,
  required = false,
  includeTime = true,
  minDate,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("19:00"); // default 7 PM

  // Parse incoming value
  useEffect(() => {
    if (!value) {
      setSelectedDate(undefined);
      return;
    }

    // Try parsing "YYYY-MM-DDTHH:mm" or ISO string
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
  }, []); // Only parse on mount to avoid loops

  // Combine date + time and emit
  const emitChange = (date: Date | undefined, time: string) => {
    if (!date) {
      onChange("");
      return;
    }

    if (includeTime) {
      const [h, m] = time.split(":").map(Number);
      const combined = setMinutes(setHours(date, h), m);
      // Format as "YYYY-MM-DDTHH:mm" (what datetime-local uses)
      onChange(format(combined, "yyyy-MM-dd'T'HH:mm"));
    } else {
      onChange(format(date, "yyyy-MM-dd"));
    }
  };

  const handleDaySelect = (day: Date | undefined) => {
    setSelectedDate(day);
    emitChange(day, selectedTime);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    emitChange(selectedDate, time);
  };

  return (
    <div className="space-y-3">
      {/* Calendar - uses react-day-picker base CSS + our overrides via style tag */}
      <style>{`
        .rdp-dab .rdp-month_caption { font-weight: 600; font-size: 0.925rem; }
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
      <div className="rounded-lg border border-zinc-200 bg-white p-2">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          disabled={minDate ? { before: minDate } : undefined}
          className="rdp-dab"
        />
      </div>

      {/* Selected date display */}
      {selectedDate && (
        <div className="text-sm font-medium text-zinc-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
          {includeTime && (
            <span className="text-orange-600">
              {" "}at {TIME_OPTIONS.find((t) => t.value === selectedTime)?.label || selectedTime}
            </span>
          )}
        </div>
      )}

      {/* Time picker */}
      {includeTime && selectedDate && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Time
          </label>

          {/* Quick time presets */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTimeChange(t.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  selectedTime === t.value
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Full time dropdown for other times */}
          <select
            value={selectedTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
}: Omit<DateTimePickerProps, "includeTime">) {
  return (
    <DateTimePicker
      value={value}
      onChange={onChange}
      required={required}
      includeTime={false}
      minDate={minDate}
    />
  );
}
