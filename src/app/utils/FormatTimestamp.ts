
export function formatTimestamp(dateString: string | Date = new Date()): string {
    const date = new Date(dateString);
  
    // Check if the date is valid
    if (isNaN(date.getTime())) return "Invalid date";
  
    // Format options for the date
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
  
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }
  