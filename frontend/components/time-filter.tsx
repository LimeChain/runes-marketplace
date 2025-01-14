export function TimeFilter() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <button className="rounded-md bg-muted px-3 py-1 text-sm font-medium text-foreground">All</button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          In-Progress
        </button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          Completed
        </button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          10min
        </button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">1h</button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">6h</button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">1d</button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">7d</button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">30d</button>
        <button className="rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">All</button>
      </div>
    </div>
  )
}

