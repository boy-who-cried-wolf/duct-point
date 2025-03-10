import { Menu } from '@headlessui/react'
import { ChevronRight, MoreVertical, Calendar, User, Check, Share2, Bookmark, Trash } from 'lucide-react'
import { Course } from '@/hooks/useCourses'

// Define the course status mapping
const courseDifficultyStatus = {
  'beginner': 'text-green-700 bg-green-50 ring-green-600/20',
  'intermediate': 'text-blue-700 bg-blue-50 ring-blue-600/20',
  'advanced': 'text-red-700 bg-red-50 ring-red-600/20',
}

// Helper function for conditional class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

interface AvailableCoursesListProps {
  courses: Course[];
  onEnroll: (courseId: string) => void;
  isEnrolled: (courseId: string) => boolean;
  onViewCourse: (courseId: string) => void;
}

export default function AvailableCoursesList({ 
  courses, 
  onEnroll, 
  isEnrolled,
  onViewCourse 
}: AvailableCoursesListProps) {
  
  // Map difficulty level from tags
  const getDifficulty = (tags: string[] | null): 'beginner' | 'intermediate' | 'advanced' => {
    if (!tags) return 'beginner';
    if (tags.includes('advanced')) return 'advanced';
    if (tags.includes('intermediate')) return 'intermediate';
    return 'beginner';
  };
  
  // Map status text from enrollment
  const getStatus = (courseId: string): string => {
    return isEnrolled(courseId) ? 'Enrolled' : 'Available';
  };

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {courses.map((course) => {
        const difficulty = getDifficulty(course.tags);
        const status = getStatus(course.id);
        
        return (
          <li key={course.id} className="flex items-center justify-between gap-x-6 py-5">
            <div className="min-w-0">
              <div className="flex items-start gap-x-3">
                <p className="text-sm font-semibold text-gray-900">{course.title}</p>
                <p
                  className={classNames(
                    courseDifficultyStatus[difficulty],
                    'mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap'
                  )}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </p>
                {isEnrolled(course.id) && (
                  <p
                    className="mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-600 ring-gray-500/10 whitespace-nowrap"
                  >
                    {status}
                  </p>
                )}
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
                <p className="whitespace-nowrap">
                  <span className="font-medium text-gray-700">{course.points} points</span> reward
                </p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                  <circle cx={1} cy={1} r={1} />
                </svg>
                <p className="truncate">
                  Created {formatDate(course.created_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-x-4">
              <button
                onClick={() => onViewCourse(course.id)}
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
              >
                View course<span className="sr-only">, {course.title}</span>
              </button>
              <Menu as="div" className="relative flex-none">
                <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                  <span className="sr-only">Open options</span>
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </Menu.Button>
                <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  {!isEnrolled(course.id) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onEnroll(course.id)}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'flex w-full items-center px-3 py-1 text-sm text-gray-900'
                          )}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Enroll
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex w-full items-center px-3 py-1 text-sm text-gray-900'
                        )}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
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
                        <Bookmark className="mr-2 h-4 w-4" />
                        Bookmark
                      </a>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
          </li>
        );
      })}
    </ul>
  )
} 