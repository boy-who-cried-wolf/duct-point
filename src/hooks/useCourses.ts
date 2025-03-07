import { useState, useEffect } from 'react';
import { supabase, logError, logSuccess } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { sendCourseRegistrationEmail } from '@/integrations/email-service';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  url: string | null;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
}

export const useCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('title');

        if (coursesError) {
          throw coursesError;
        }

        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', user.id);

        if (enrollmentsError) {
          throw enrollmentsError;
        }

        setCourses(coursesData as Course[] || []);
        setEnrolledCourses(enrollmentsData as CourseEnrollment[] || []);
        logSuccess('COURSES: Data fetched successfully', { 
          coursesCount: coursesData?.length || 0,
          enrollmentsCount: enrollmentsData?.length || 0
        });
      } catch (err: any) {
        logError('COURSES: Error fetching data', { error: err });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast.error('You must be logged in to enroll in a course');
      return;
    }

    try {
      const isEnrolled = enrolledCourses.some(
        enrollment => enrollment.course_id === courseId
      );

      if (isEnrolled) {
        toast.info('You are already enrolled in this course');
        return;
      }

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (courseError) {
        throw courseError;
      }

      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([{ course_id: courseId, user_id: user.id }])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setEnrolledCourses([...enrolledCourses, data[0] as CourseEnrollment]);
      }

      toast.success('Successfully enrolled in course');
      
      await supabase
        .from('audit_logs')
        .insert({
          action: 'course_enrolled',
          entity_type: 'course',
          entity_id: courseId,
          user_id: user.id,
          details: {}
        });
        
      if (courseData) {
        await sendCourseRegistrationEmail(user, {
          courseTitle: courseData.title,
          courseDescription: courseData.description || '',
          courseUrl: courseData.url || window.location.href,
          points: courseData.points,
          enrolledAt: new Date().toISOString()
        });
      }

    } catch (err: any) {
      logError('COURSES: Error enrolling in course', { error: err });
      toast.error(`Failed to enroll: ${err.message}`);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrolledCourses.some(
      enrollment => enrollment.course_id === courseId
    );
  };

  return {
    courses,
    enrolledCourses,
    loading,
    error,
    enrollInCourse,
    isEnrolled
  };
};
