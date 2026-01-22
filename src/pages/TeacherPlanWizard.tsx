import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, X, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomizationPanel } from '@/components/ui/CustomizationPanel';
import { api } from '@/services/api';
import type { Font } from '@/types';

export function TeacherPlanWizard() {
  const { csId, classNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const courseSubjectId = parseInt(csId || '0');
  const classNum = parseInt(classNumber || '0');

  const {
    lessonWizardData,
    updateLessonWizardData,
    resetLessonWizardData,
    categories,
    activities,
    coordinationStatus,
    fonts,
    setFonts,
    courseSubjects,
    subjects,
  } = useStore();

  // Get the current course subject from the store using the URL param
  const currentCourseSubject = courseSubjects.find((cs) => cs.id === courseSubjectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMoment, setCurrentMoment] = useState<string>('');
  const [selectedActivitiesInModal, setSelectedActivitiesInModal] = useState<number[]>([]);

  useEffect(() => {
    const state = location.state as any;
    if (state) {
      updateLessonWizardData({
        classNumber: classNum,
        title: state.title || '',
        categoryIds: state.categoryIds || [],
        objective: state.objective || '',
      });
    }
  }, []);

  // Fetch fonts when component mounts
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        // Get area_id from subject
        const subject = subjects.find((s) => s.id === currentCourseSubject?.subject_id);
        const areaId = subject?.area_id;
        const fontsData = (await api.fonts.getAll(areaId)) as Font[];
        setFonts(fontsData);
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };
    fetchFonts();
  }, [courseSubjectId, courseSubjects, subjects, setFonts]);

  const openModal = (momentKey: string) => {
    setCurrentMoment(momentKey);
    const moment = lessonWizardData.moments[momentKey as keyof typeof lessonWizardData.moments];
    setSelectedActivitiesInModal(moment.activities || []);
    setIsModalOpen(true);
  };

  const handleToggleActivityInModal = (activityId: number) => {
    setSelectedActivitiesInModal((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId],
    );
  };

  const handleAddActivities = () => {
    if (currentMoment) {
      const moment = lessonWizardData.moments[currentMoment as keyof typeof lessonWizardData.moments];
      updateLessonWizardData({
        moments: {
          ...lessonWizardData.moments,
          [currentMoment]: { ...moment, activities: selectedActivitiesInModal },
        },
      });
    }
    setIsModalOpen(false);
  };

  const removeActivity = (momentKey: string, activityId: number) => {
    const moment = lessonWizardData.moments[momentKey as keyof typeof lessonWizardData.moments];
    const newActivities = moment.activities.filter((id) => id !== activityId);
    updateLessonWizardData({
      moments: {
        ...lessonWizardData.moments,
        [momentKey]: { ...moment, activities: newActivities },
      },
    });
  };

  const handleCreatePlan = async () => {
    if (!coordinationStatus || !coordinationStatus.has_published_document) {
      alert('No hay documento de coordinacion publicado');
      return;
    }

    const data = {
      course_subject_id: courseSubjectId,
      coordination_document_id: coordinationStatus.document_id,
      class_number: classNum,
      title: lessonWizardData.title,
      category_ids: lessonWizardData.categoryIds,
      objective: lessonWizardData.objective,
      knowledge_content: lessonWizardData.knowledgeContent || '',
      didactic_strategies: lessonWizardData.didacticStrategies || '',
      class_format: lessonWizardData.classFormat || '',
      moments: lessonWizardData.moments,
      custom_instruction: lessonWizardData.customInstruction || null,
      resources_mode: lessonWizardData.resourcesMode,
      global_font_id: lessonWizardData.globalFontId,
      moment_font_ids: lessonWizardData.momentFontIds,
    };

    try {
      const createdPlan = await api.lessonPlans.create(data);
      resetLessonWizardData();
      navigate(`/teacher/plan/${(createdPlan as any).id}`);
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      alert('Error al crear el plan de clase');
    }
  };

  const progress = (lessonWizardData.step / 2) * 100;

  const documentCategoryIds = coordinationStatus?.category_ids || [];
  const availableCategories = categories.filter((c) => documentCategoryIds.includes(c.id));

  const momentTypes = [
    { key: 'apertura', name: 'Apertura/Motivacion', description: 'Momento inicial de la clase' },
    { key: 'desarrollo', name: 'Desarrollo/Construccion', description: 'Momento central de la clase' },
    { key: 'cierre', name: 'Cierre/Metacognicion', description: 'Momento final de reflexion' },
  ];

  const allMomentsHaveActivities = momentTypes.every((moment) => {
    const activitiesList =
      lessonWizardData.moments[moment.key as keyof typeof lessonWizardData.moments].activities || [];
    return activitiesList.length > 0;
  });

  return (
    <div className="fixed inset-0 z-50 gradient-background flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-linear-to-br from-[#DAD5F6]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-linear-to-br from-[#01ceaa]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Scrollable content area */}
      <div className="relative flex-1 overflow-y-auto py-8 px-6">
        <div className="max-w-4xl mx-auto pb-24">
          <button
            onClick={() => {
              resetLessonWizardData();
              navigate(`/teacher/cs/${courseSubjectId}`);
            }}
            className="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-900 transition-colors z-10"
          >
            <X className="w-6 h-6 cursor-pointer" />
          </button>

          <Progress value={progress} className="mb-6 h-2" />

          {lessonWizardData.step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="title-2-bold text-[#2C2C2C]">Detalles de la clase</h2>
                <p className="body-2-regular text-[#2C2C2C]">
                  Revisa la informacion de la clase antes de continuar con la planificacion.
                </p>
              </div>

              <div className="activity-card-bg p-4 space-y-2 rounded-2xl">
                <div className="mb-6">
                  <h3 className="headline-1-bold text-secondary-foreground mb-2">Objetivo</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    El objetivo de la clase fue elegido en el itinerario del area. Podes modificarlo si es necesario.
                  </p>
                  <Textarea
                    value={lessonWizardData.objective}
                    onChange={(e) => updateLessonWizardData({ objective: e.target.value })}
                    placeholder="Ingresa el objetivo de la clase..."
                    className="min-h-25 resize-none"
                  />
                </div>

                <div className="h-px bg-[#DAD5F6]" />

                <div className="py-4 space-y-4">
                  <h3 className="headline-1-bold text-secondary-foreground mb-2">Nudos disciplinares</h3>
                  <p className="body-2-regular text-secondary-foreground">
                    Analisis de las formas de ser y estar humanas en distintos tiempos, espacios y territorios, y de
                    como esas concepciones se disputan historicamente.
                  </p>
                  <p className="body-2-regular text-secondary-foreground">
                    Estudio de la conquista y colonizacion de America como base del sistema
                    capitalista-patriarcal-colonial moderno, y de la centralidad europea como proyecto universal.
                  </p>
                  <p className="body-2-regular text-secondary-foreground">
                    Reflexion sobre los modos de produccion, las relaciones de dominacion sobre cuerpos y territorios, y
                    los procesos sociales que impulsan nuevas relaciones humanas emancipadoras
                  </p>
                </div>

                <div className="h-px bg-[#DAD5F6]" />

                <div className="py-4">
                  <h3 className="headline-1-bold text-secondary-foreground mb-2">Categorias a trabajar</h3>
                  <ul className="space-y-1">
                    {availableCategories.map((c) => (
                      <li key={c.id} className="body-2-regular text-secondary-foreground flex items-start">
                        <span className="mr-2">-</span>
                        <span>{c.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {lessonWizardData.step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="title-2-bold text-[#2C2C2C]">Momentos y actividades</h2>
                <p className="body-2-regular text-[#2C2C2C]">
                  Selecciona las actividades que se trabajaran en cada momento de la clase.
                </p>
              </div>

              <div className="flex gap-6">
                {/* Left column - Moments */}
                <div className="flex-1 space-y-6">
                  {momentTypes.map((moment) => {
                    const selectedActivityIds =
                      lessonWizardData.moments[moment.key as keyof typeof lessonWizardData.moments].activities || [];
                    const selectedActivities = activities.filter((act) => selectedActivityIds.includes(act.id));

                    return (
                      <div key={moment.key} className="space-y-3 activity-card-bg rounded-2xl p-4">
                        <h3 className="body-1-medium text-secondary-foreground">{moment.name}</h3>

                        {selectedActivities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedActivities.map((activity) => (
                              <Badge
                                key={activity.id}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1 rounded-lg fill-primary!"
                              >
                                {activity.name}
                                <button
                                  type="button"
                                  onClick={() => removeActivity(moment.key, activity.id)}
                                  className="ml-1 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => openModal(moment.key)}
                          className="flex items-center gap-2 headline-2-semi-bold text-secondary-foreground transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar actividad
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Right column - Customization Panel */}
                <div className="w-80 shrink-0">
                  <CustomizationPanel
                    customInstruction={lessonWizardData.customInstruction}
                    onCustomInstructionChange={(value) => updateLessonWizardData({ customInstruction: value })}
                    resourcesMode={lessonWizardData.resourcesMode}
                    onResourcesModeChange={(mode) => updateLessonWizardData({ resourcesMode: mode })}
                    globalFontId={lessonWizardData.globalFontId}
                    onGlobalFontChange={(fontId) => updateLessonWizardData({ globalFontId: fontId })}
                    momentFontIds={lessonWizardData.momentFontIds}
                    onMomentFontChange={(moment, fontId) =>
                      updateLessonWizardData({
                        momentFontIds: { ...lessonWizardData.momentFontIds, [moment]: fontId },
                      })
                    }
                    fonts={fonts}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer with buttons */}
      <div className="relative backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {lessonWizardData.step === 1 && (
            <div className="flex justify-end">
              <Button onClick={() => updateLessonWizardData({ step: 2 })} className="gap-2 cursor-pointer">
                Comenzar
                <ArrowRight />
              </Button>
            </div>
          )}

          {lessonWizardData.step === 2 && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => updateLessonWizardData({ step: 1 })}
                className="text-primary font-medium cursor-pointer hover:underline"
              >
                Anterior
              </button>
              <Button onClick={handleCreatePlan} disabled={!allMomentsHaveActivities} className="cursor-pointer">
                Planificar clase
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para seleccionar actividades */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar actividades</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`activity-${activity.id}`}
                  checked={selectedActivitiesInModal.includes(activity.id)}
                  onCheckedChange={() => handleToggleActivityInModal(activity.id)}
                  className="cursor-pointer"
                />
                <label
                  htmlFor={`activity-${activity.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {activity.name}
                </label>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-row! justify-between! items-center w-full">
            <span className="text-sm text-muted-foreground">
              {selectedActivitiesInModal.length}{' '}
              {selectedActivitiesInModal.length === 1 ? 'Actividad seleccionada' : 'Actividades seleccionadas'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="cursor-pointer hover:bg-transparent! hover:text-secondary-foreground!"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddActivities} className="cursor-pointer">
                Agregar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
