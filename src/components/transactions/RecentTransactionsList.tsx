import { Menu } from '@headlessui/react'
import { Clock, MoreVertical, ArrowRight, Eye, FileText, Download } from 'lucide-react'

// Define the transaction interface
interface Transaction {
  id: number;
  type: "earned" | "spent";
  points: number;
  description: string;
  date: string;
}

interface RecentTransactionsListProps {
  transactions: Transaction[];
  onViewDetails?: (id: number) => void;
}

// Helper function for conditional class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Define point badge styles
const pointBadgeStyles = {
  earned: 'text-green-700 bg-green-50 ring-green-600/20',
  spent: 'text-red-700 bg-red-50 ring-red-600/20',
}

export default function RecentTransactionsList({ transactions, onViewDetails }: RecentTransactionsListProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {transactions.map((transaction) => (
        <li key={transaction.id} className="flex items-center justify-between gap-x-6 py-5">
          <div className="min-w-0">
            <div className="flex items-start gap-x-3">
              <p className="text-sm font-semibold text-gray-900">{transaction.description}</p>
              <p
                className={classNames(
                  transaction.type === "earned" 
                    ? pointBadgeStyles.earned 
                    : pointBadgeStyles.spent,
                  'mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset'
                )}
              >
                {transaction.type === "earned" ? `+${transaction.points} points` : `-${transaction.points} points`}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
              <div className="flex items-center whitespace-nowrap">
                <Clock className="mr-1 h-3 w-3" />
                <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
              </div>
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(transaction.id)}
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
              >
                View details<span className="sr-only">, {transaction.description}</span>
              </button>
            )}
            <Menu as="div" className="relative flex-none">
              <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                <span className="sr-only">Open options</span>
                <MoreVertical className="h-5 w-5" aria-hidden="true" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onViewDetails && onViewDetails(transaction.id)}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-3 py-1 text-sm text-gray-900'
                      )}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-3 py-1 text-sm text-gray-900'
                      )}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Receipt
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-3 py-1 text-sm text-gray-900'
                      )}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </li>
      ))}
    </ul>
  )
} 