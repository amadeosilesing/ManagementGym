interface FilterTab {
  key:   string
  label: string
  count?: number
}

interface FilterTabsProps {
  tabs:     FilterTab[]
  active:   string
  onChange: (key: string) => void
}

export default function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer
            ${active === tab.key
              ? 'bg-[#185FA5] text-white font-medium'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium
              ${active === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
              }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}