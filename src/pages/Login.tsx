import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AnimatedOrb } from '@/components/ui/AnimatedOrb';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import type { User, Area, CourseSubject } from '@/types';
import { GraduationCap, Users } from 'lucide-react';

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

  const getAvatarGradient = (index: number) => {
    const gradients = [
      'from-[#735FE3] to-[#9B8AE8]',
      'from-[#10B981] to-[#34D399]',
      'from-[#F59E0B] to-[#FBBF24]',
      'from-[#EC4899] to-[#F472B6]',
      'from-[#3B82F6] to-[#60A5FA]',
      'from-[#8B5CF6] to-[#A78BFA]',
    ];
    return gradients[index % gradients.length];
  };

  const UserCard = ({ user, index }: { user: User; index: number }) => (
    <div
      className="group cursor-pointer"
      onClick={() => handleSelectUser(user.id)}
      style={{
        animation: 'fadeInUp 0.5s ease-out forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
      }}
    >
      <div className="relative rounded-2xl p-4 border transition-all duration-300 group-hover:scale-[1.02] overflow-hidden border-[#DAD5F6] group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 bg-linear-to-br from-white to-primary/5">
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar with glow */}
          <div className="relative shrink-0">
            <div
              className={`absolute inset-0 rounded-full bg-linear-to-br ${getAvatarGradient(index)} blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
            />
            <div
              className={`relative w-12 h-12 rounded-full bg-linear-to-br ${getAvatarGradient(index)} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}
            >
              <span className="text-lg font-bold text-white drop-shadow-sm">{user.name.charAt(0)}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="body-2-medium text-[#10182B] truncate group-hover:text-primary transition-colors">
              {user.name}
            </p>
            <p className="text-xs text-[#47566C] truncate">{getUserRoleLabel(user.id)}</p>
          </div>

          {/* Arrow indicator */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-primary/10 shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen gradient-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <div className="flex flex-col items-center gap-4">
          <AnimatedOrb size="md" />
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen gradient-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Central Card Container */}
      <div className="w-full max-w-5xl flex flex-col relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl animate-pulse" />
            </div>
            <div className="flex flex-col items-center">
              <AnimatedOrb size="md" className="mb-4" />
              <h2 className="title-1-regular text-primary">Bienvenido a Alizia</h2>
              <h3 className="title-2-regular text-muted-foreground">Selecciona tu perfil para comenzar</h3>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-xl opacity-50" />

          <div className="relative activity-card-bg rounded-3xl border border-[#DAD5F6] overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row">
              {/* Coordinators Section */}
              <div className="flex-1 p-5 relative">
                {/* Section gradient overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex flex-col items-center gap-2 mb-4 relative">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-center">
                    <h2 className="body-1-medium text-[#10182B]">Coordinadores</h2>
                    <p className="text-xs text-[#47566C]">Gestiona áreas y docentes</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 relative">
                  {coordinators.length > 0 ? (
                    coordinators.map((user, index) => <UserCard key={user.id} user={user} index={index} />)
                  ) : (
                    <p className="text-xs text-[#47566C]/60 italic text-center py-4">
                      No hay coordinadores disponibles
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:flex items-center py-6">
                <div className="w-px h-[90%] bg-[#DAD5F6]" />
              </div>
              <div className="md:hidden px-5">
                <div className="h-px w-full bg-[#DAD5F6]" />
              </div>

              {/* Teachers Section */}
              <div className="flex-1 p-5 relative">
                {/* Section gradient overlay */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

                <div className="flex flex-col items-center gap-2 mb-4 relative">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-center">
                    <h2 className="body-1-medium text-[#10182B]">Docentes</h2>
                    <p className="text-xs text-[#47566C]">Planifica y gestiona tus clases</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 relative">
                  {teachers.length > 0 ? (
                    teachers.map((user, index) => (
                      <UserCard key={user.id} user={user} index={coordinators.length + index} />
                    ))
                  ) : (
                    <p className="text-xs text-[#47566C]/60 italic text-center py-4">No hay docentes disponibles</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#47566C]/60 mt-4">
          Alizia - Asistente de planificación educativa con IA
        </p>
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
