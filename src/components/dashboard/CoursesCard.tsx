
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Course {
  id: number;
  title: string;
  description: string;
  pointValue: number;
  duration: string;
  difficulty: string;
}

interface CoursesCardProps {
  courses: Course[];
}

const CoursesCard = ({ courses }: CoursesCardProps) => {
  const navigate = useNavigate();

  const enrollInCourse = (courseId: number) => {
    toast.success(`Enrolled in course #${courseId}`);
  };

  return (
    <Card className="overflow-hidden shadow-none border-none">
      <CardHeader>
        <CardTitle>Available Courses</CardTitle>
        <CardDescription>
          Courses you can take to earn points
        </CardDescription>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No courses available yet.
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <div 
                key={course.id} 
                className="p-3 rounded-md border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{course.title}</h3>
                  <span className="text-blue-500 font-medium text-sm">
                    {course.pointValue} points
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {course.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline">{course.difficulty}</Badge>
                    <Badge variant="outline">{course.duration}</Badge>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-full" 
                    onClick={() => enrollInCourse(course.id)}
                  >
                    Enroll
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 flex justify-end bg-transparent">
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-full gap-1" 
          onClick={() => navigate("/courses")}
        >
          Browse all courses
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CoursesCard;
