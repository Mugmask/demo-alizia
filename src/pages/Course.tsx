import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TabsCustom, TabsCustomContent, TabsCustomList, TabsCustomTrigger } from '@/components/ui/tabs-custom';
import { StudentsList } from '@/components/ui/StudentsList';
import { CourseInfo } from '@/components/ui/CourseInfo';
import { DocumentSectionsList, type DocumentSection } from '@/components/ui/DocumentSectionsList';
import { api } from '@/services/api';

interface Student {
  id: number;
  name: string;
}

const DOCUMENT_SECTIONS: DocumentSection[] = [
  {
    id: 1,
    name: 'Primer cuatrimestre',
    topics: [
      {
        id: 1,
        name: 'Revolución Negra de Haití',
        status: 'pending',
        categoriesCount: 7,
      },
      {
        id: 2,
        name: 'Revolución Cubana',
        status: 'pending',
        categoriesCount: 7,
      },
    ],
  },
  {
    id: 2,
    name: 'Segundo cuatrimestre',
    topics: [
      {
        id: 3,
        name: 'Revolución Industrial China',
        status: 'pending',
        categoriesCount: 4,
      },
      {
        id: 4,
        name: 'Revolución Industrial Inglesa',
        status: 'pending',
        categoriesCount: 4,
      },
    ],
  },
];

export function Course() {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = parseInt(id || '0');

  const { courses } = useStore();
  const getUserArea = useStore((state) => state.getUserArea());

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      const studentsData = await api.courses.getStudents(courseId);
      setStudents(studentsData as Student[]);
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWizard = (topicId: number) => {
    navigate(`/curso/${courseId}/crear?topicId=${topicId}`);
  };

  const handleEditDocument = (documentId: number) => {
    navigate(`/doc/${documentId}`);
  };

  if (!course) {
    return <div>Curso no encontrado</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-4 mb-6 cursor-pointer transition-colors hover:text-gray-600"
      >
        <ChevronLeft className="text-[#10182B]" />
        <h1 className="title-2-emphasized text-[#10182B]">Curso {course.name}</h1>
      </button>

      <TabsCustom defaultValue="about" className="w-full">
        <TabsCustomList className="mb-8">
          <TabsCustomTrigger value="about">Detalle del curso</TabsCustomTrigger>
          <TabsCustomTrigger value="classes">Doc. de coordenadas</TabsCustomTrigger>
        </TabsCustomList>

        <TabsCustomContent value="about" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StudentsList students={students} isLoading={isLoading} showActions={true} />

            <CourseInfo
              fields={[
                { label: 'INSTITUCIÓN', value: 'IFD. N°13' },
                { label: 'ÁREA', value: getUserArea?.name || 'N/A' },
                { label: 'NIVEL', value: 'Secundaria' },
                { label: 'TURNO', value: 'Mañana' },
                { label: 'CICLO LECTIVO', value: '2026' },
              ]}
              showSchedule={true}
            />
          </div>
        </TabsCustomContent>

        <TabsCustomContent value="classes" className="space-y-6">
          <DocumentSectionsList
            sections={DOCUMENT_SECTIONS}
            isLoading={isLoading}
            onCreateDocument={handleStartWizard}
            onEditDocument={handleEditDocument}
          />
        </TabsCustomContent>
      </TabsCustom>
    </div>
  );
}
