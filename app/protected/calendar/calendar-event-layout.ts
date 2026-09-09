type PositionedEvent = { id: string; top: number; height: number };

// Use rendered bounds so minimum-height blocks cannot obscure nearby short events.
export function layoutCalendarEvents(events: PositionedEvent[]) {
  const result = new Map<string, { column: number; columns: number }>();
  const sorted = [...events].sort((a, b) => a.top - b.top || b.height - a.height || a.id.localeCompare(b.id));
  let group: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let groupEnd = -Infinity;

  function finishGroup() {
    for (const event of group) result.set(event.id, { column: event.column, columns: columnEnds.length });
    group = [];
    columnEnds = [];
  }

  for (const event of sorted) {
    if (event.top >= groupEnd) finishGroup();
    let column = columnEnds.findIndex(end => end <= event.top);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = event.top + event.height;
    group.push({ id: event.id, column });
    groupEnd = Math.max(groupEnd, event.top + event.height);
  }
  finishGroup();
  return result;
}
