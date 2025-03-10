import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, BookOpen, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import StatsCard from "@/components/ui/StatsCard";
import CourseList from "@/components/courses/CourseList";

// Mock courses data
const mockCourses = [
  {
    id: 1,
    title: "Introduction to React",
    description: "Learn the basics of React and component-based architecture.",
    pointValue: 100,
    duration: "2 hours",
    difficulty: "Beginner",
    enrolledUsers: 42,
    completionRate: "78%"
  },
  {
    id: 2,
    title: "Advanced CSS Techniques",
    description: "Master modern CSS layouts, animations, and responsive design.",
    pointValue: 150,
    duration: "3 hours",
    difficulty: "Intermediate",
    enrolledUsers: 38,
    completionRate: "65%"
  },
  {
    id: 3,
    title: "Git Version Control",
    description: "Learn how to use Git for effective team collaboration.",
    pointValue: 75,
    duration: "1.5 hours",
    difficulty: "Beginner",
    enrolledUsers: 56,
    completionRate: "82%"
  },
  {
    id: 4,
    title: "TypeScript Fundamentals",
    description: "Learn static typing with TypeScript to build more robust applications.",
    pointValue: 120,
    duration: "2.5 hours",
    difficulty: "Intermediate",
    enrolledUsers: 31,
    completionRate: "70%"
  },
  {
    id: 5,
    title: "Docker Essentials",
    description: "Containerize your applications for consistent deployment across environments.",
    pointValue: 150,
    duration: "3 hours",
    difficulty: "Advanced",
    enrolledUsers: 24,
    completionRate: "61%"
  },
  {
    id: 6,
    title: "JavaScript ES6+ Features",
    description: "Master modern JavaScript features and syntax improvements.",
    pointValue: 90,
    duration: "2 hours",
    difficulty: "Intermediate",
    enrolledUsers: 45,
    completionRate: "76%"
  },
  {
    id: 7,
    title: "RESTful API Design",
    description: "Learn best practices for designing and consuming RESTful APIs.",
    pointValue: 130,
    duration: "2.5 hours",
    difficulty: "Intermediate",
    enrolledUsers: 33,
    completionRate: "68%"
  },
  {
    id: 8,
    title: "Web Accessibility (A11y)",
    description: "Make your web applications accessible to all users, including those with disabilities.",
    pointValue: 110,
    duration: "2 hours",
    difficulty: "Intermediate",
    enrolledUsers: 29,
    completionRate: "72%"
  }
];

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const enrollInCourse = (courseId: number) => {
    toast.success(`Enrolled in course #${courseId}`);
  };

  // Filter courses based on search term and difficulty
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesSearch && matchesDifficulty;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground mt-1">
          Browse available courses and earn points by completing them
        </p>
      </div>

      <div className="mb-6">
        <StatsCard 
          title="Course Stats"
          stats={[
            { name: 'Total Courses', stat: mockCourses.length.toString() },
            { name: 'Potential Points', stat: `${mockCourses.reduce((total, course) => total + course.pointValue, 0)} points` },
            { name: 'Avg. Completion Rate', stat: '73%' },
          ]}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Available Courses</CardTitle>
              <CardDescription>
                Enroll in courses to earn points and build your skills
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  className="pl-8 w-full sm:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Difficulty</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No courses found matching your search criteria.
            </div>
          ) : (
            <CourseList courses={paginatedCourses} onEnroll={enrollInCourse} />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredCourses.length)}</span> of <span className="font-medium">{filteredCourses.length}</span> courses
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Courses;
