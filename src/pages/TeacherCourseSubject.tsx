import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { TabsCustom, TabsCustomContent, TabsCustomList, TabsCustomTrigger } from '@/components/ui/tabs-custom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentsList } from '@/components/ui/StudentsList';
import { CourseInfo } from '@/components/ui/CourseInfo';
import { DocumentSectionsList, type DocumentSection, type DocumentTopic } from '@/components/ui/DocumentSectionsList';
import { api } from '@/services/api';
import { ChevronLeft, File } from 'lucide-react';

interface Student {
  id: number;
  name: string;
}

interface CoordinationStatus {
  has_published_document: boolean;
  document_name?: string;
  coordinator_name?: string;
  class_plan?: any[];
  document_id?: number;
}

export function TeacherCourseSubject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const csId = parseInt(id || '0');

  const { courses, courseSubjects, subjects, areas, setCoordinationStatus, setLessonPlans } = useStore();

  const [students, setStudents] = useState<Student[]>([]);
  const [coordStatus, setCoordStatus] = useState<CoordinationStatus | null>(null);
  const [lessonPlans, setLocalLessonPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('about');
  const [isLoading, setIsLoading] = useState(true);

  const cs = courseSubjects.find((c) => c.id === csId);
  const course = cs ? courses.find((c) => c.id === cs.course_id) : null;
  const subject = cs ? subjects.find((s) => s.id === cs.subject_id) : null;
  const subjectArea = subject ? areas.find((a) => a.id === subject.area_id) : null;

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

  const handleViewCoordinationDocument = () => {
    if (coordStatus?.document_id) {
      navigate(`/doc/${coordStatus.document_id}?readonly=true`);
    }
  };

  const handleStartPlanWizard = (topicId: number) => {
    navigate(`/teacher/planificar/${csId}/${topicId}`);
  };

  const handleEditDocument = (documentId: number) => {
    navigate(`/teacher/plan/${documentId}`);
  };

  // Transform class plan data to DocumentSections format
  const transformToDocumentSections = (): DocumentSection[] => {
    if (!coordStatus?.class_plan || coordStatus.class_plan.length === 0) {
      return [];
    }

    // Group classes by cuatrimestre (assuming we have this info or can derive it)
    const classesByCuatrimestre: Record<string, any[]> = {};

    coordStatus.class_plan!.forEach((c: any) => {
      // For now, let's assume first half of classes are "Primer cuatrimestre" and second half are "Segundo cuatrimestre"
      // This logic should be adjusted based on actual data structure
      const cuatrimestre =
        c.class_number <= Math.ceil(coordStatus.class_plan!.length / 2)
          ? 'Primer cuatrimestre'
          : 'Segundo cuatrimestre';

      if (!classesByCuatrimestre[cuatrimestre]) {
        classesByCuatrimestre[cuatrimestre] = [];
      }
      classesByCuatrimestre[cuatrimestre].push(c);
    });

    return Object.entries(classesByCuatrimestre).map(([name, classes], index) => ({
      id: index + 1,
      name,
      topics: classes.map((c: any): DocumentTopic & { classType?: string } => {
        const existingPlan = lessonPlanMap[c.class_number];
        return {
          id: c.class_number,
          name: c.title || `Clase ${c.class_number}`,
          status: existingPlan ? (existingPlan.status === 'planned' ? 'completed' : 'in_progress') : 'pending',
          categoriesCount: c.category_ids?.length || 0,
          documentId: existingPlan?.id,
          classType: c.class_type || 'Individual', // Add class type info
        };
      }),
    }));
  };

  // Custom badge renderer for teacher view
  const renderTeacherBadge = (topic: DocumentTopic & { classType?: string }) => {
    return (
      <span className="text-xs font-semibold text-foreground">
        Clase {topic.id} • {topic.classType || 'Individual'}
      </span>
    );
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
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-4 cursor-pointer transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="text-[#10182B]" />
          <h1 className="title-2-emphasized text-[#10182B]">
            {cs.course_name} - {cs.subject_name}
          </h1>
        </button>

        {coordStatus?.has_published_document && activeTab === 'classes' && (
          <Button
            variant="outline"
            onClick={handleViewCoordinationDocument}
            className="flex items-center gap-2 text-primary bg-muted border-none cursor-pointer rounded-xl hover:bg-muted hover:text-primary"
          >
            <File className="w-4 h-4 text-primary" />
            Itinerario del área
          </Button>
        )}
      </div>

      <TabsCustom value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsCustomList className="mb-8">
          <TabsCustomTrigger value="about">Detalle del curso</TabsCustomTrigger>
          <TabsCustomTrigger value="classes">Mis clases</TabsCustomTrigger>
        </TabsCustomList>

        <TabsCustomContent value="about" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StudentsList students={students} isLoading={isLoading} showActions={false} />

            <CourseInfo
              fields={[
                { label: 'INSTITUCIÓN', value: 'Escuela DEMO' },
                { label: 'ÁREA', value: subjectArea?.name || 'N/A' },
                { label: 'NIVEL', value: 'Secundaria' },
                { label: 'TURNO', value: 'Mañana' },
                { label: 'CICLO LECTIVO', value: '2026' },
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
            <DocumentSectionsList
              sections={transformToDocumentSections()}
              isLoading={isLoading}
              onCreateDocument={handleStartPlanWizard}
              onEditDocument={handleEditDocument}
              createButtonText="Planificar clase"
              editButtonText="Revisar plan"
              renderBadge={renderTeacherBadge}
            />
          )}
        </TabsCustomContent>
      </TabsCustom>
    </div>
  );
}
