import { Link, useLocation } from 'react-router-dom';

interface Tab {
  name: string;
  href: string;
  current?: boolean;
}

interface TabsNavigationProps {
  tabs: Tab[];
  onChange?: (href: string) => void;
  activeColor?: 'indigo' | 'red';
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function TabsNavigation({ tabs, onChange, activeColor = 'indigo' }: TabsNavigationProps) {
  const location = useLocation();
  
  // Determine which tab is active
  const activeTabs = tabs.map(tab => ({
    ...tab,
    current: tab.current !== undefined ? tab.current : (
      // If href includes a query parameter, check if the URL contains it
      tab.href.includes('?') 
        ? location.pathname === tab.href.split('?')[0] && location.search.includes(tab.href.split('?')[1])
        : location.pathname === tab.href
    )
  }));
  
  // Default active tab
  const activeTab = activeTabs.find((tab) => tab.current) || activeTabs[0];
  
  const activeColorClass = activeColor === 'indigo' ? 'indigo' : 'red';
  
  const getActiveClasses = (isCurrent: boolean) => {
    if (isCurrent) {
      return activeColor === 'indigo' 
        ? 'border-indigo-500 text-indigo-600'
        : 'border-red-500 text-red-600';
    }
    return 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:hidden">
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          defaultValue={activeTab?.name}
          onChange={(e) => {
            const selectedTab = tabs.find(tab => tab.name === e.target.value);
            if (selectedTab && onChange) {
              onChange(selectedTab.href);
            }
          }}
          aria-label="Select a tab"
          className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-${activeColorClass}-600`}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
        <div
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 h-5 w-5 self-center justify-self-end fill-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {activeTabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.href}
                onClick={(e) => {
                  if (onChange) {
                    e.preventDefault();
                    onChange(tab.href);
                  }
                }}
                aria-current={tab.current ? 'page' : undefined}
                className={classNames(
                  getActiveClasses(tab.current || false),
                  'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap',
                )}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
} 