import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  BookOpen, 
  Users, 
  Tag,
  Link as LinkIcon, 
  X, 
  Check, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchCourses, 
  fetchCourseEnrollments, 
  fetchUnenrolledUsers,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollUser,
  unenrollUser,
  Course,
  CourseEnrollment,
  User
} from './coursesApi';

interface CoursesTabProps {
  searchQuery: string;
  isLoading: boolean;
}

const CourseCard = ({ 
  course, 
  onEdit, 
  onDelete, 
  onViewEnrollments 
}: { 
  course: Course, 
  onEdit: (course: Course) => void, 
  onDelete: (courseId: string) => void,
  onViewEnrollments: (courseId: string) => void
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{course.title}</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(course)}
              aria-label="Edit course"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(course.id)}
              aria-label="Delete course"
              className="text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {course.points} points
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {course.description || 'No description available'}
        </p>
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {course.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-3 border-t bg-transparent">
        {course.url ? (
          <a 
            href={course.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm flex items-center text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Visit Course
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">No URL available</span>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewEnrollments(course.id)}
          className="text-xs"
        >
          <Users className="h-3.5 w-3.5 mr-1" />
          Enrollments
        </Button>
      </CardFooter>
    </Card>
  );
};

const CourseForm = ({ 
  course, 
  onSubmit, 
  onCancel 
}: { 
  course?: Course,
  onSubmit: (data: Partial<Course>) => void,
  onCancel: () => void
}) => {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(course?.tags || []);
  const [url, setUrl] = useState(course?.url || '');
  const [points, setPoints] = useState(course?.points?.toString() || '0');

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      tags,
      url: url || null,
      points: parseInt(points, 10) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Course title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={description || ''} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Course description"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input 
          id="url" 
          value={url || ''} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="https://example.com/course"
          type="url"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="points">Points</Label>
        <Input 
          id="points" 
          value={points} 
          onChange={(e) => setPoints(e.target.value.replace(/\D/g, ''))} 
          placeholder="Points awarded for completion"
          type="number"
          min="0"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex space-x-2">
          <Input 
            id="tags" 
            value={tagInput} 
            onChange={(e) => setTagInput(e.target.value)} 
            placeholder="Add a tag"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" onClick={addTag} size="sm">
            Add
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {course ? 'Update Course' : 'Create Course'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const EnrollmentsTable = ({ 
  enrollments, 
  onUnenroll 
}: { 
  enrollments: CourseEnrollment[], 
  onUnenroll: (enrollmentId: string) => void 
}) => {
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users enrolled in this course yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">User</th>
            <th className="text-left py-3 px-4">Enrolled Date</th>
            <th className="text-right py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map(enrollment => (
            <tr key={enrollment.id} className="border-b">
              <td className="py-3 px-4">{enrollment.userName}</td>
              <td className="py-3 px-4">
                {new Date(enrollment.enrolledAt).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnenroll(enrollment.id)}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Unenroll
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UnenrolledUsersTable = ({ 
  users, 
  onEnroll 
}: { 
  users: User[], 
  onEnroll: (userId: string) => void 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        All users are already enrolled in this course.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">User</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b">
                <td className="py-3 px-4">{user.name}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEnroll(user.id)}
                    className="text-primary"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Enroll
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CoursesTab: React.FC<CoursesTabProps> = ({ searchQuery, isLoading }) => {
  const { user, logAuditEvent } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseForEnrollment, setCourseForEnrollment] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [unenrolledUsers, setUnenrolledUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEnrollments, setShowEnrollments] = useState(false);
  const [enrollmentTab, setEnrollmentTab] = useState('enrolled');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter courses based on search query
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  
  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses', error);
      toast.error('Failed to load courses');
    }
  };
  
  const loadEnrollments = async (courseId: string) => {
    try {
      const data = await fetchCourseEnrollments(courseId);
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to load enrollments', error);
      toast.error('Failed to load enrollments');
    }
  };
  
  const loadUnenrolledUsers = async (courseId: string) => {
    try {
      const data = await fetchUnenrolledUsers(courseId);
      setUnenrolledUsers(data);
    } catch (error) {
      console.error('Failed to load unenrolled users', error);
      toast.error('Failed to load users');
    }
  };
  
  useEffect(() => {
    loadCourses();
  }, []);
  
  const handleCreateCourse = async (courseData: Partial<Course>) => {
    setIsSubmitting(true);
    try {
      const newCourse = await createCourse(courseData);
      setCourses(prev => [...prev, newCourse]);
      setIsCreating(false);
      toast.success('Course created successfully');
      
      await logAuditEvent(
        'course_created',
        'course',
        newCourse.id,
        { title: newCourse.title }
      );
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateCourse = async (courseData: Partial<Course>) => {
    if (!selectedCourse) return;
    
    setIsSubmitting(true);
    try {
      const updatedCourse = await updateCourse(selectedCourse.id, courseData);
      setCourses(prev => prev.map(course => 
        course.id === updatedCourse.id ? updatedCourse : course
      ));
      setIsEditing(false);
      setSelectedCourse(null);
      toast.success('Course updated successfully');
      
      await logAuditEvent(
        'course_updated',
        'course',
        updatedCourse.id,
        { title: updatedCourse.title }
      );
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully');
      
      await logAuditEvent(
        'course_deleted',
        'course',
        courseId,
        {}
      );
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };
  
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditing(true);
  };
  
  const handleEnrollUser = async (userId: string) => {
    if (!courseForEnrollment) return;
    
    try {
      await enrollUser(courseForEnrollment.id, userId);
      
      // Refresh both enrolled and unenrolled lists
      await loadEnrollments(courseForEnrollment.id);
      await loadUnenrolledUsers(courseForEnrollment.id);
      toast.success('User enrolled successfully');
      
      await logAuditEvent(
        'user_enrolled',
        'course_enrollment',
        courseForEnrollment.id,
        { userId }
      );
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Failed to enroll user');
    }
  };
  
  const handleUnenrollUser = async (enrollmentId: string) => {
    try {
      await unenrollUser(enrollmentId);
      
      // Remove from current list
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      
      // Refresh unenrolled users if showing that tab
      if (courseForEnrollment && enrollmentTab === 'unenrolled') {
        await loadUnenrolledUsers(courseForEnrollment.id);
      }
      toast.success('User unenrolled successfully');
      
      await logAuditEvent(
        'user_unenrolled',
        'course_enrollment',
        enrollmentId,
        {}
      );
    } catch (error) {
      console.error('Error unenrolling user:', error);
      toast.error('Failed to unenroll user');
    }
  };
  
  const handleViewEnrollments = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    setCourseForEnrollment(course);
    setEnrollmentTab('enrolled');
    setShowEnrollments(true);
    
    await loadEnrollments(courseId);
  };
  
  const handleEnrollmentTabChange = async (value: string) => {
    setEnrollmentTab(value);
    
    if (value === 'unenrolled' && courseForEnrollment) {
      await loadUnenrolledUsers(courseForEnrollment.id);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    try {
      const data = await fetchCourses({ page: newPage });
      setCourses(data.courses);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load courses', error);
      toast.error('Failed to load courses');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Course Management</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add details for the new course.
              </DialogDescription>
            </DialogHeader>
            <CourseForm 
              onSubmit={handleCreateCourse} 
              onCancel={() => setIsCreating(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Course edit dialog */}
      <Dialog 
        open={isEditing} 
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) setSelectedCourse(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course details.
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <CourseForm 
              course={selectedCourse} 
              onSubmit={handleUpdateCourse} 
              onCancel={() => {
                setIsEditing(false);
                setSelectedCourse(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollments dialog */}
      <Dialog 
        open={showEnrollments} 
        onOpenChange={(open) => {
          setShowEnrollments(open);
          if (!open) setCourseForEnrollment(null);
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              Course Enrollments: {courseForEnrollment?.title}
            </DialogTitle>
            <DialogDescription>
              Manage user enrollments for this course.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={enrollmentTab} onValueChange={handleEnrollmentTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enrolled">Enrolled Users</TabsTrigger>
              <TabsTrigger value="unenrolled">Add Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enrolled" className="mt-4">
              <EnrollmentsTable 
                enrollments={enrollments} 
                onUnenroll={handleUnenrollUser} 
              />
            </TabsContent>
            
            <TabsContent value="unenrolled" className="mt-4">
              <UnenrolledUsersTable 
                users={unenrolledUsers} 
                onEnroll={handleEnrollUser} 
              />
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course list */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onEdit={handleEditCourse}
              onDelete={handleDeleteCourse}
              onViewEnrollments={handleViewEnrollments}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted rounded-md">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No courses found</h3>
          <p className="text-muted-foreground">
            {courses.length > 0 ? 
              'Try adjusting your search query.' : 
              'Get started by adding your first course.'}
          </p>
        </div>
      )}

      {error && (
        <div className="text-center p-6 text-sm text-muted-foreground">
          {error}
        </div>
      )}

      <CardFooter className="flex justify-between pt-3 border-t bg-transparent">
        <div>
          <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Course
          </Button>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </div>
  );
};

export default CoursesTab;
