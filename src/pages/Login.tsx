import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AnimatedOrb } from '@/components/ui/AnimatedOrb';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import type { User, Area, CourseSubject } from '@/types';
import { BookOpenText, Building } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { users, areas, courseSubjects, setUsers, setAreas, setCourseSubjects, setCurrentUser } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, areasData, courseSubjectsData] = await Promise.all([
        api.users.getAll(),
        api.areas.getAll(),
        api.courseSubjects.getAll(),
      ]);
      setUsers(usersData as User[]);
      setAreas(areasData as Area[]);
      setCourseSubjects(courseSubjectsData as CourseSubject[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRoleLabel = (userId: number) => {
    const area = areas.find((a) => a.coordinator_id === userId);
    if (area) return `Coordinador/a de ${area.name}`;

    const teacherSubjects = courseSubjects.filter((cs) => cs.teacher_id === userId);
    if (teacherSubjects.length > 0) {
      const subjectNames = [...new Set(teacherSubjects.map((cs) => cs.subject_name))];
      return `Docente de ${subjectNames.join(', ')}`;
    }

    return 'Sin rol asignado';
  };

  const isCoordinator = (userId: number) => {
    return areas.some((a) => a.coordinator_id === userId);
  };

  const coordinators = users.filter((user) => isCoordinator(user.id));
  const teachers = users.filter((user) => !isCoordinator(user.id));

  const handleSelectUser = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      navigate('/');
    }
  };

  const getOrbColor = (index: number) => {
    const colors = [
      'from-violet-400 to-purple-600',
      'from-blue-400 to-cyan-600',
      'from-emerald-400 to-teal-600',
      'from-amber-400 to-orange-600',
      'from-pink-400 to-rose-600',
      'from-indigo-400 to-blue-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full relative z-10 flex flex-col items-center">
        {/* Header with orb */}
        <div className="flex flex-col items-center mb-8">
          <AnimatedOrb size="md" className="mb-6" />
          <h1 className="large-title-2-bold text-primary mb-2 text-center">Bienvenido a Alizia</h1>
          <p className="body-1-regular text-muted-foreground text-center">Selecciona tu perfil para comenzar</p>
        </div>

        <div className="w-full max-w-7xl">
          {/* Coordinators Section */}
          {isLoading ? (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="headline-1-bold text-primary">Coordinadores</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-transparent to-transparent" />
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center mb-3">
                      <Skeleton className="w-24 h-24 rounded-full" />
                    </div>
                    <div className="text-center w-28 space-y-2">
                      <Skeleton className="h-4 w-20 mx-auto" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : coordinators.length > 0 ? (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="headline-1-bold text-primary">Coordinadores</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-transparent to-transparent" />
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {coordinators.map((user, index) => (
                  <div
                    key={user.id}
                    className="group cursor-pointer flex flex-col items-center"
                    onClick={() => handleSelectUser(user.id)}
                    style={{
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      animationDelay: `${index * 0.08}s`,
                      opacity: 0,
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Subtle glow effect */}
                      <div
                        className={`absolute w-32 h-32 bg-gradient-to-br ${getOrbColor(index)} rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`}
                      />

                      {/* User orb */}
                      <div
                        className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getOrbColor(index)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 border-2 border-white/20`}
                      >
                        <span className="text-4xl font-bold text-white drop-shadow-lg">{user.name.charAt(0)}</span>
                      </div>
                    </div>

                    {/* User info */}
                    <div className="mt-3 text-center w-28">
                      <p className="body-2-medium mb-0.5 truncate">{user.name}</p>
                      <p className="callout-regular text-muted-foreground text-xs line-clamp-1">
                        {getUserRoleLabel(user.id)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Teachers Section */}
          {isLoading ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <BookOpenText className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="headline-1-bold text-accent">Docentes</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-accent/30 via-transparent to-transparent" />
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center mb-3">
                      <Skeleton className="w-24 h-24 rounded-full" />
                    </div>
                    <div className="text-center w-28 space-y-2">
                      <Skeleton className="h-4 w-20 mx-auto" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : teachers.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <BookOpenText className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="headline-1-bold text-accent">Docentes</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-accent/30 via-transparent to-transparent" />
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {teachers.map((user, index) => (
                  <div
                    key={user.id}
                    className="group cursor-pointer flex flex-col items-center"
                    onClick={() => handleSelectUser(user.id)}
                    style={{
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      animationDelay: `${(coordinators.length + index) * 0.08}s`,
                      opacity: 0,
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Subtle glow effect */}
                      <div
                        className={`absolute w-32 h-32 bg-gradient-to-br ${getOrbColor(coordinators.length + index)} rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`}
                      />

                      {/* User orb */}
                      <div
                        className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getOrbColor(coordinators.length + index)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 border-2 border-white/20`}
                      >
                        <span className="text-4xl font-bold text-white drop-shadow-lg">{user.name.charAt(0)}</span>
                      </div>
                    </div>

                    {/* User info */}
                    <div className="mt-3 text-center w-28">
                      <p className="body-2-medium mb-0.5 truncate">{user.name}</p>
                      <p className="callout-regular text-muted-foreground text-xs line-clamp-1">
                        {getUserRoleLabel(user.id)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
