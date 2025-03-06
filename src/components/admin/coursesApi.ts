
import { supabase, logError, logSuccess, logInfo } from '../../integrations/supabase/client';

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
  userId: string;
  userName: string;
  courseId: string;
  enrolledAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
}

export const fetchCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('title');
    
  if (error) {
    logError('Failed to fetch courses', error);
    throw error;
  }
  
  return data.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    tags: course.tags,
    url: course.url,
    points: course.points,
    created_at: course.created_at,
    updated_at: course.updated_at
  }));
};

export const fetchCourseEnrollments = async (courseId: string): Promise<CourseEnrollment[]> => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('id, user_id, course_id, enrolled_at')
    .eq('course_id', courseId);
    
  if (error) {
    logError('Failed to fetch course enrollments', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(enrollment => enrollment.user_id))];
  
  if (userIds.length === 0) {
    return [];
  }
  
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for enrollments', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(enrollment => ({
    id: enrollment.id,
    userId: enrollment.user_id,
    userName: userMap.get(enrollment.user_id) || 'Unknown User',
    courseId: enrollment.course_id,
    enrolledAt: enrollment.enrolled_at
  }));
};

export const fetchUnenrolledUsers = async (courseId: string): Promise<User[]> => {
  // Get all enrolled user IDs for this course
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('user_id')
    .eq('course_id', courseId);
    
  if (enrollmentError) {
    logError('Failed to fetch course enrollments', enrollmentError);
    throw enrollmentError;
  }
  
  const enrolledUserIds = enrollmentData.map(enrollment => enrollment.user_id);
  
  // Get all users that are not enrolled
  const { data: userData, error: userError } = enrolledUserIds.length > 0 
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, total_points')
        .not('id', 'in', `(${enrolledUserIds.join(',')})`)
    : await supabase
        .from('profiles')
        .select('id, full_name, email, total_points');
  
  if (userError) {
    logError('Failed to fetch unenrolled users', userError);
    throw userError;
  }
  
  const { data: roleData, error: roleError } = await supabase
    .from('user_platform_roles')
    .select('user_id, role');
    
  if (roleError) {
    logError('Failed to fetch user roles', roleError);
  }
  
  const roleMap = new Map();
  if (roleData) {
    roleData.forEach(item => {
      roleMap.set(item.user_id, item.role);
    });
  }
  
  return userData.map(user => ({
    id: user.id,
    name: user.full_name || 'Unknown',
    email: user.email || 'No email',
    role: roleMap.get(user.id) || 'user',
    points: user.total_points || 0
  }));
};

export const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert([{
      title: courseData.title,
      description: courseData.description,
      tags: courseData.tags,
      url: courseData.url,
      points: courseData.points || 0
    }])
    .select()
    .single();
    
  if (error) {
    logError('Failed to create course', error);
    throw error;
  }
  
  logSuccess('Course created successfully', data);
  return data;
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .update({
      title: courseData.title,
      description: courseData.description,
      tags: courseData.tags,
      url: courseData.url,
      points: courseData.points,
      updated_at: new Date().toISOString()
    })
    .eq('id', courseId)
    .select()
    .single();
    
  if (error) {
    logError('Failed to update course', error);
    throw error;
  }
  
  logSuccess('Course updated successfully', data);
  return data;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
    
  if (error) {
    logError('Failed to delete course', error);
    throw error;
  }
  
  logSuccess('Course deleted successfully', { courseId });
};

export const enrollUser = async (courseId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('course_enrollments')
    .insert([{
      course_id: courseId,
      user_id: userId
    }]);
    
  if (error) {
    logError('Failed to enroll user', error);
    throw error;
  }
  
  logSuccess('User enrolled successfully', { courseId, userId });
};

export const unenrollUser = async (enrollmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('course_enrollments')
    .delete()
    .eq('id', enrollmentId);
    
  if (error) {
    logError('Failed to unenroll user', error);
    throw error;
  }
  
  logSuccess('User unenrolled successfully', { enrollmentId });
};
