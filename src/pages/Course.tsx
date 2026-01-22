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

export function Course() {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = parseInt(id || '0');

  const { courses, nuclei, knowledgeAreas, categories } = useStore();
  const getUserArea = useStore((state) => state.getUserArea());

  const [students, setStudents] = useState<Student[]>([]);
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const course = courses.find((c) => c.id === courseId);
  const userArea = getUserArea;

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      const studentsData = await api.courses.getStudents(courseId);
      setStudents(studentsData as Student[]);

      // Load existing coordination documents for this area
      const allDocs = await api.documents.getAll();
      const areaDocs = userArea ? (allDocs as any[]).filter((d) => d.area_id === userArea.id) : [];

      // Build sections from knowledge areas
      if (userArea && knowledgeAreas.length > 0) {
        const midpoint = Math.ceil(knowledgeAreas.length / 2);
        const firstSemesterKnowledgeAreas = knowledgeAreas.slice(0, midpoint);
        const secondSemesterKnowledgeAreas = knowledgeAreas.slice(midpoint);

        const sections: DocumentSection[] = [];

        // Helper function to build topics with document status
        const buildTopics = (knowledgeAreasList: any[]) => {
          return knowledgeAreasList.map((knowledgeArea) => {
            const knowledgeAreaCategories = categories.filter((cat) => cat.knowledge_area_id === knowledgeArea.id);
            const categoryCount = knowledgeAreaCategories.length;

            // Find if there's a document for this knowledge area's nucleus
            const nucleus = nuclei.find((n) => n.id === knowledgeArea.nucleus_id);
            const existingDoc = nucleus
              ? areaDocs.find((doc: any) => doc.nucleus_ids && doc.nucleus_ids.includes(nucleus.id))
              : undefined;

            return {
              id: knowledgeArea.id,
              name: knowledgeArea.name,
              status: (existingDoc ? (existingDoc.status === 'published' ? 'completed' : 'in_progress') : 'pending') as
                | 'pending'
                | 'in_progress'
                | 'completed',
              categoriesCount: categoryCount,
              documentId: existingDoc?.id,
              nucleusId: knowledgeArea.nucleus_id,
            };
          });
        };

        // Primer cuatrimestre
        if (firstSemesterKnowledgeAreas.length > 0) {
          sections.push({
            id: 1,
            name: 'Primer cuatrimestre',
            topics: buildTopics(firstSemesterKnowledgeAreas),
          });
        }

        // Segundo cuatrimestre
        if (secondSemesterKnowledgeAreas.length > 0) {
          sections.push({
            id: 2,
            name: 'Segundo cuatrimestre',
            topics: buildTopics(secondSemesterKnowledgeAreas),
          });
        }

        setDocumentSections(sections);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = (knowledgeAreaId?: number) => {
    if (knowledgeAreaId) {
      // Find the knowledge area and its associated data
      const knowledgeArea = knowledgeAreas.find((ka) => ka.id === knowledgeAreaId);
      const nucleus = knowledgeArea ? nuclei.find((n) => n.id === knowledgeArea.nucleus_id) : undefined;
      const areaCategories = categories.filter((cat) => cat.knowledge_area_id === knowledgeAreaId);

      if (knowledgeArea && nucleus) {
        // Update wizard data with the specific knowledge area information
        useStore.getState().updateWizardData({
          knowledgeAreaId: knowledgeArea.id,
          knowledgeAreaName: knowledgeArea.name,
          nucleusId: nucleus.id,
          nucleusDescription: nucleus.description || '',
          categoryIds: areaCategories.map((cat) => cat.id),
        });
      }
    }
    navigate(`/curso/${courseId}/crear`);
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
        onClick={() => navigate('/')}
        className="flex items-center gap-4 mb-6 cursor-pointer transition-colors hover:text-gray-600"
      >
        <ChevronLeft className="text-[#10182B]" />
        <h1 className="title-2-emphasized text-[#10182B]">Curso {course.name}</h1>
      </button>

      <TabsCustom defaultValue="about" className="w-full">
        <TabsCustomList className="mb-8">
          <TabsCustomTrigger value="about">Detalle del curso</TabsCustomTrigger>
          <TabsCustomTrigger value="classes">Itinerario del área</TabsCustomTrigger>
        </TabsCustomList>

        <TabsCustomContent value="about" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StudentsList students={students} isLoading={isLoading} showActions={true} />

            <CourseInfo
              fields={[
                { label: 'INSTITUCIÓN', value: 'Escuela DEMO' },
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
            sections={documentSections}
            isLoading={isLoading}
            onCreateDocument={handleCreateDocument}
            onEditDocument={handleEditDocument}
            createButtonText="Crear documento"
            editButtonText="Ver documento"
          />
        </TabsCustomContent>
      </TabsCustom>
    </div>
  );
}
