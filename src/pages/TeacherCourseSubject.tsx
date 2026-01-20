import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { TabsCustom, TabsCustomContent, TabsCustomList, TabsCustomTrigger } from '@/components/ui/tabs-custom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentsList } from '@/components/ui/StudentsList';
import { CourseInfo } from '@/components/ui/CourseInfo';
import { api } from '@/services/api';
import { ChevronLeft } from 'lucide-react';

interface Student {
  id: number;
  name: string;
}

interface CoordinationStatus {
  has_published_document: boolean;
  document_name?: string;
  coordinator_name?: string;
  class_plan?: any[];
}

export function TeacherCourseSubject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const csId = parseInt(id || '0');

  const { courses, courseSubjects, categories, setCoordinationStatus, setLessonPlans } = useStore();

  const [students, setStudents] = useState<Student[]>([]);
  const [coordStatus, setCoordStatus] = useState<CoordinationStatus | null>(null);
  const [lessonPlans, setLocalLessonPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cs = courseSubjects.find((c) => c.id === csId);
  const course = cs ? courses.find((c) => c.id === cs.course_id) : null;

  useEffect(() => {
    loadData();
  }, [csId]);

  const loadData = async () => {
    if (!cs) return;

    try {
      setIsLoading(true);
      const [studentsData, coordStatusData, lessonPlansData] = await Promise.all([
        api.courses.getStudents(cs.course_id),
        api.courseSubjects.getCoordinationStatus(csId),
        api.lessonPlans.getByCourseSubject(csId),
      ]);

      setStudents(studentsData as Student[]);
      setCoordStatus(coordStatusData as CoordinationStatus);
      setLocalLessonPlans(lessonPlansData as any[]);
      setCoordinationStatus(coordStatusData);
      setLessonPlans(lessonPlansData as any[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPlanWizard = (classNumber: number, title: string, categoryIds: number[], objective: string) => {
    navigate(`/teacher/planificar/${csId}/${classNumber}`, {
      state: { title, categoryIds, objective },
    });
  };

  if (!cs || !course) {
    return <div>Curso-materia no encontrado</div>;
  }

  const lessonPlanMap: Record<number, any> = {};
  lessonPlans.forEach((lp) => {
    lessonPlanMap[lp.class_number] = lp;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-4 mb-6 cursor-pointer transition-colors hover:text-gray-600"
      >
        <ChevronLeft className="text-[#10182B]" />
        <h1 className="title-2-emphasized text-[#10182B]">
          {cs.course_name} - {cs.subject_name}
        </h1>
      </button>

      <TabsCustom defaultValue="about" className="w-full">
        <TabsCustomList className="mb-8">
          <TabsCustomTrigger value="about">Detalle del curso</TabsCustomTrigger>
          <TabsCustomTrigger value="classes">Mis clases</TabsCustomTrigger>
        </TabsCustomList>

        <TabsCustomContent value="about" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StudentsList students={students} isLoading={isLoading} showActions={false} />

            <CourseInfo
              fields={[
                { label: 'CURSO', value: cs.course_name },
                { label: 'MATERIA', value: cs.subject_name },
              ]}
              showSchedule={true}
            />
          </div>
        </TabsCustomContent>

        <TabsCustomContent value="classes" className="space-y-6">
          {isLoading ? (
            // Skeleton loading state for classes
            <Card className="bg-white/50 backdrop-blur-sm border-slate-200 rounded-3xl">
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 mx-auto rounded-lg" />
                  <Skeleton className="h-6 w-48 mx-auto" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                  <Skeleton className="h-4 w-56 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : !coordStatus?.has_published_document ? (
            <Card className="bg-white/50 backdrop-blur-sm border-slate-200 rounded-3xl">
              <CardContent className="py-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="headline-1-bold text-foreground mb-2">Documento de coordinación no disponible</h3>
                <p className="body-1-regular text-muted-foreground mb-2">
                  El coordinador aún no ha publicado el documento de coordinación para esta materia.
                </p>
                <p className="body-2-regular text-muted-foreground">Contacta al coordinador para más información.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <h3 className="headline-1-bold text-foreground mb-2">Plan de clases</h3>
                <p className="body-2-regular text-muted-foreground">
                  Documento: {coordStatus.document_name} | Coordinador: {coordStatus.coordinator_name || 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
                {(coordStatus.class_plan || []).length === 0 ? (
                  <p className="body-1-regular text-muted-foreground">
                    No hay clases definidas en el documento de coordinación
                  </p>
                ) : (
                  (coordStatus.class_plan || []).map((c: any) => {
                    const existingPlan = lessonPlanMap[c.class_number];
                    const statusClass = existingPlan
                      ? existingPlan.status === 'planned'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100';
                    const statusLabel = existingPlan
                      ? existingPlan.status === 'planned'
                        ? 'Planificada'
                        : 'En progreso'
                      : 'Sin planificar';

                    const categoryNames = (c.category_ids || []).map((catId: number) => {
                      const cat = categories.find((cat) => cat.id === catId);
                      return cat ? cat.name : `Cat ${catId}`;
                    });

                    return (
                      <Card key={c.class_number} className="bg-white/50 backdrop-blur-sm border-slate-200 rounded-3xl">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className="rounded-xl">
                                  Clase {c.class_number}
                                </Badge>
                                <Badge className={statusClass}>{statusLabel}</Badge>
                              </div>
                              <h4 className="headline-1-bold text-foreground mb-3">{c.title || 'Sin título'}</h4>
                              <div className="flex flex-wrap gap-2">
                                {categoryNames.map((name: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="rounded-xl">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant={existingPlan ? 'outline' : 'default'}
                              onClick={() =>
                                existingPlan
                                  ? navigate(`/teacher/plan/${existingPlan.id}`)
                                  : handleStartPlanWizard(
                                      c.class_number,
                                      c.title || '',
                                      c.category_ids || [],
                                      c.objective || '',
                                    )
                              }
                            >
                              {existingPlan ? 'Revisar' : 'Planificar'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </TabsCustomContent>
      </TabsCustom>
    </div>
  );
}
