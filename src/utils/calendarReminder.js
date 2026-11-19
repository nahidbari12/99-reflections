function formatLocalCalendarDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

export function downloadDailyReminder(hour = 19) {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(Number(hour) || 19, 0, 0, 0);
  const end = new Date(start.getTime() + 10 * 60 * 1000);
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//99 Reflections//Daily Learning//EN", "BEGIN:VEVENT",
    `UID:daily-journey-${Date.now()}@99namesofallah.org`, `DTSTART:${formatLocalCalendarDate(start)}`, `DTEND:${formatLocalCalendarDate(end)}`,
    "RRULE:FREQ=DAILY", "SUMMARY:My 99 Reflections daily journey", "DESCRIPTION:Spend a few calm minutes learning and reflecting on the 99 Names of Allah. https://99namesofallah.org/smart-learn",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "99-reflections-daily-reminder.ics";
  link.click();
  URL.revokeObjectURL(url);
}
