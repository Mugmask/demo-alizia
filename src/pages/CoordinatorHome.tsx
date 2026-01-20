import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AnimatedOrb } from '@/components/ui/AnimatedOrb';
import { ActivityCard, ActivityCardSkeleton } from '@/components/ui/ActivityCard';
import { api } from '@/services/api';
import type { Course } from '@/types';

export function CoordinatorHome() {
  const navigate = useNavigate();
  const { currentUser, courses, setCourses } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  const firstName = currentUser?.name.split(' ')[0] || '';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const coursesData = await api.courses.getAll();
      setCourses(coursesData as Course[]);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full px-6 py-12">
      <div className="flex flex-col items-center mb-16 mt-8">
        <AnimatedOrb size="lg" className="mb-8" />

        <h2 className="large-title-1-regular text-primary">Hola {firstName},</h2>
        <h3 className="large-title-2-regular">¿En qué curso trabajamos hoy?</h3>
      </div>

      <div className="w-full max-w-5xl">
        <h2 className="text-xl font-semibold text-secondary-foreground mb-6 px-4">Mis cursos</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 px-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <ActivityCardSkeleton key={index} />)
            : courses.map((course) => (
                <ActivityCard
                  key={course.id}
                  title={course.name}
                  subtitle="Turno mañana"
                  description="Nivel secundario"
                  onClick={() => navigate(`/curso/${course.id}`)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
