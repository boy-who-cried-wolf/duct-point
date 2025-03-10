import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BookOpen, MoreVertical, Clock, User } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  pointValue: number;
  duration: string;
  difficulty: string;
  enrolledUsers: number;
  completionRate: string;
}

const statuses = {
  'Beginner': 'text-green-700 bg-green-50 ring-green-600/20',
  'Intermediate': 'text-blue-700 bg-blue-50 ring-blue-600/20',
  'Advanced': 'text-red-700 bg-red-50 ring-red-600/20',
};

interface CourseListProps {
  courses: Course[];
  onEnroll: (courseId: number) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CourseList({ courses, onEnroll }: CourseListProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {courses.map((course) => (
        <li key={course.id} className="flex items-center justify-between gap-x-6 py-5">
          <div className="min-w-0">
            <div className="flex items-start gap-x-3">
              <p className="text-sm/6 font-semibold text-gray-900">{course.title}</p>
              <p
                className={classNames(
                  statuses[course.difficulty] || 'text-gray-600 bg-gray-50 ring-gray-500/10',
                  'mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
                )}
              >
                {course.difficulty}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <p className="whitespace-nowrap">{course.duration}</p>
              </div>
              <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <div className="flex items-center">
                <User className="mr-1 h-3 w-3" />
                <p className="truncate">{course.enrolledUsers} enrolled</p>
              </div>
              <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p className="truncate">Completion rate: {course.completionRate}</p>
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            <button
              onClick={() => onEnroll(course.id)}
              className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:block"
            >
              Enroll<span className="sr-only">, {course.title}</span>
            </button>
            <Menu as="div" className="relative flex-none">
              <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                <span className="sr-only">Open options</span>
                <MoreVertical className="size-5" aria-hidden="true" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm/6 text-gray-900'
                        )}
                      >
                        View details<span className="sr-only">, {course.title}</span>
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm/6 text-gray-900'
                        )}
                      >
                        Share<span className="sr-only">, {course.title}</span>
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm/6 text-gray-900'
                        )}
                      >
                        Bookmark<span className="sr-only">, {course.title}</span>
                      </a>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </li>
      ))}
    </ul>
  );
} 