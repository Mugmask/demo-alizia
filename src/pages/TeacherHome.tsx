import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AnimatedOrb } from '@/components/ui/AnimatedOrb';
import { ActivityCard, ActivityCardSkeleton } from '@/components/ui/ActivityCard';
import { api } from '@/services/api';
import type { CourseSubject } from '@/types';

export function TeacherHome() {
  const navigate = useNavigate();
  const { currentUser, courseSubjects, setTeacherCourses } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  const firstName = currentUser?.name.split(' ')[0] || '';
  const teacherId = currentUser?.id;

  useEffect(() => {
    loadTeacherCourses();
  }, [teacherId]);

  const loadTeacherCourses = async () => {
    try {
      setIsLoading(true);
      const allCourseSubjects = await api.courseSubjects.getAll();
      const teacherCourseSubjects = (allCourseSubjects as CourseSubject[]).filter((cs) => cs.teacher_id === teacherId);
      setTeacherCourses(teacherCourseSubjects);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const teacherCourses = courseSubjects.filter((cs) => cs.teacher_id === teacherId);

  return (
    <div className="flex flex-col items-center justify-start min-h-full px-6 py-12">
      <div className="flex flex-col items-center mb-16 mt-8">
        <AnimatedOrb size="lg" className="mb-8" />

        <h2 className="large-title-1-regular text-primary">Hola {firstName},</h2>
        <h3 className="large-title-2-regular">¿En qué materia trabajamos hoy?</h3>
      </div>

      <div className="w-full max-w-5xl">
        <h2 className="text-xl font-semibold text-secondary-foreground mb-6 px-4">Mis materias</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 px-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <ActivityCardSkeleton key={index} />)
            : teacherCourses.map((cs) => (
                <ActivityCard
                  key={cs.id}
                  title={cs.subject_name}
                  subtitle={cs.course_name}
                  description="Planificar y gestionar clases"
                  onClick={() => navigate(`/teacher/cs/${cs.id}`)}
                />
              ))}
        </div>

        {teacherCourses.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm border-slate-200 rounded-3xl p-8">
            <p className="body-1-regular text-muted-foreground text-center">No tienes materias asignadas</p>
          </div>
        )}
      </div>
    </div>
  );
}
