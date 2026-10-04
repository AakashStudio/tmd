interface Tab {
  id: string;
  label: string;
  badge?: number | string | null;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex border-b border-[#1E1E26] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 relative pb-3 pt-1 text-sm font-bold tracking-wider transition-colors cursor-pointer select-none ${
              isActive ? 'text-[#FF1493]' : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && tab.badge !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-[#FF1493] text-white' : 'bg-[#1E1E26] text-[#A1A1AA]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF1493] rounded-t-full shadow-[0_0_8px_rgba(255,20,147,0.6)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
