const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type AvailabilityCalendarProps = {
  availability: string;
  availableToday?: boolean | null;
  availableTomorrow?: boolean | null;
};

export function AvailabilityCalendar({
  availability,
  availableToday,
  availableTomorrow,
}: AvailabilityCalendarProps) {
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900">Availability</h3>
      <p className="mt-1 text-sm text-gray-500">{availability}</p>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {DAYS.map((day, i) => {
          const isToday = i === todayIdx;
          const isTomorrow = i === (todayIdx + 1) % 7;
          const available =
            (isToday && availableToday) ||
            (isTomorrow && availableTomorrow) ||
            (!isToday && !isTomorrow && i < 5);

          return (
            <div
              key={day}
              className={`rounded-lg py-2 text-center text-xs font-medium transition-colors duration-200 ${
                isToday
                  ? "bg-green-600 text-white ring-2 ring-green-200"
                  : available
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {day}
              {isToday && <div className="text-[10px] opacity-80">Today</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-300" /> Unavailable
        </span>
      </div>
    </div>
  );
}
