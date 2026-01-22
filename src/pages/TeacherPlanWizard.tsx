import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomizationPanel } from '@/components/ui/CustomizationPanel';
import { api } from '@/services/api';
import type { Font, Activity, ActivityRecommendation } from '@/types';

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
    activitiesByMoment,
    activityRecommendations,
    setActivitiesByMoment,
    setActivityRecommendations,
    coordinationStatus,
    fonts,
    setFonts,
    courseSubjects,
    subjects,
  } = useStore();

  const currentCourseSubject = courseSubjects.find(cs => cs.id === courseSubjectId);

  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

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
        const subject = subjects.find((s) => s.id === currentCourseSubject?.subject_id);
        const areaId = subject?.area_id;
        const fontsData = await api.fonts.getAll(areaId) as Font[];
        setFonts(fontsData);
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };
    fetchFonts();
  }, [courseSubjectId, courseSubjects, subjects, setFonts]);

  // Fetch activities grouped by moment
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesData = await api.activities.getAll();
        setActivitiesByMoment(activitiesData as any);
      } catch (error) {
        console.error('Error loading activities:', error);
      }
    };
    fetchActivities();
  }, [setActivitiesByMoment]);

  // Fetch AI recommendations when entering Step 2
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (lessonWizardData.step === 2 && lessonWizardData.objective && !activityRecommendations) {
        setIsLoadingRecommendations(true);
        try {
          const recommendations = await api.activities.recommend(
            lessonWizardData.objective,
            lessonWizardData.categoryIds
          ) as ActivityRecommendation;
          setActivityRecommendations(recommendations);
        } catch (error) {
          console.error('Error loading recommendations:', error);
        } finally {
          setIsLoadingRecommendations(false);
        }
      }
    };
    fetchRecommendations();
  }, [lessonWizardData.step, lessonWizardData.objective, lessonWizardData.categoryIds, activityRecommendations, setActivityRecommendations]);

  const handleSelectAperturaActivity = (activityId: number) => {
    updateLessonWizardData({
      moments: {
        ...lessonWizardData.moments,
        apertura: { activities: [activityId] },
      },
    });
  };

  const handleSelectCierreActivity = (activityId: number) => {
    updateLessonWizardData({
      moments: {
        ...lessonWizardData.moments,
        cierre: { activities: [activityId] },
      },
    });
  };

  const handleToggleDesarrolloActivity = (activityId: number) => {
    const currentActivities = lessonWizardData.moments.desarrollo.activities || [];
    let newActivities: number[];

    if (currentActivities.includes(activityId)) {
      newActivities = currentActivities.filter((id: number) => id !== activityId);
    } else {
      if (currentActivities.length >= 3) {
        return; // Don't allow more than 3
      }
      newActivities = [...currentActivities, activityId];
    }

    updateLessonWizardData({
      moments: {
        ...lessonWizardData.moments,
        desarrollo: { activities: newActivities },
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
      setActivityRecommendations(null);
      navigate(`/teacher/plan/${(createdPlan as any).id}`);
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      alert('Error al crear el plan de clase');
    }
  };

  const progress = (lessonWizardData.step / 2) * 100;

  const documentCategoryIds = coordinationStatus?.category_ids || [];
  const availableCategories = categories.filter((c) => documentCategoryIds.includes(c.id));

  // Check if all moments have required activities
  const aperturaSelected = (lessonWizardData.moments.apertura.activities || []).length === 1;
  const desarrolloSelected = (lessonWizardData.moments.desarrollo.activities || []).length >= 1;
  const cierreSelected = (lessonWizardData.moments.cierre.activities || []).length === 1;
  const allMomentsValid = aperturaSelected && desarrolloSelected && cierreSelected;

  const isRecommended = (momentType: string, activityId: number): boolean => {
    if (!activityRecommendations) return false;
    if (momentType === 'apertura') return activityRecommendations.apertura_recommended_id === activityId;
    if (momentType === 'cierre') return activityRecommendations.cierre_recommended_id === activityId;
    if (momentType === 'desarrollo') return activityRecommendations.desarrollo_recommended_ids?.includes(activityId);
    return false;
  };

  const renderActivityCard = (activity: Activity, momentType: 'apertura' | 'cierre', isSelected: boolean) => (
    <label
      key={activity.id}
      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name={`${momentType}-activity`}
          checked={isSelected}
          onChange={() => momentType === 'apertura' ? handleSelectAperturaActivity(activity.id) : handleSelectCierreActivity(activity.id)}
          className="mt-1 w-4 h-4 text-primary cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-secondary-foreground">{activity.name}</span>
            {isRecommended(momentType, activity.id) && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-500 text-white text-xs gap-1">
                <Sparkles className="w-3 h-3" />
                Recomendada
              </Badge>
            )}
          </div>
          {activity.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
          )}
        </div>
      </div>
    </label>
  );

  const renderDesarrolloActivityCard = (activity: Activity, isSelected: boolean, isDisabled: boolean) => (
    <label
      key={activity.id}
      className={`block p-4 rounded-xl border-2 transition-all ${
        isDisabled && !isSelected
          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
          : isSelected
          ? 'border-primary bg-primary/5 cursor-pointer'
          : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={`desarrollo-${activity.id}`}
          checked={isSelected}
          disabled={isDisabled && !isSelected}
          onCheckedChange={() => handleToggleDesarrolloActivity(activity.id)}
          className="mt-1 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-secondary-foreground">{activity.name}</span>
            {isRecommended('desarrollo', activity.id) && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-500 text-white text-xs gap-1">
                <Sparkles className="w-3 h-3" />
                Recomendada
              </Badge>
            )}
          </div>
          {activity.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
          )}
        </div>
      </div>
    </label>
  );

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
              setActivityRecommendations(null);
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
                    className="min-h-[100px] resize-none"
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
                {isLoadingRecommendations && (
                  <p className="text-sm text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Cargando recomendaciones de IA...
                  </p>
                )}
              </div>

              <div className="flex gap-6">
                {/* Left column - Moments */}
                <div className="flex-1 space-y-6">
                  {/* Apertura Section */}
                  <div className="space-y-3 activity-card-bg rounded-2xl p-4">
                    <div>
                      <h3 className="body-1-medium text-secondary-foreground">Apertura/Motivacion</h3>
                      <p className="text-sm text-muted-foreground">Selecciona 1 actividad para el inicio de la clase</p>
                    </div>
                    <div className="space-y-2">
                      {activitiesByMoment.apertura.map((activity) => {
                        const isSelected = lessonWizardData.moments.apertura.activities?.includes(activity.id);
                        return renderActivityCard(activity, 'apertura', isSelected);
                      })}
                    </div>
                  </div>

                  {/* Desarrollo Section */}
                  <div className="space-y-3 activity-card-bg rounded-2xl p-4">
                    <div>
                      <h3 className="body-1-medium text-secondary-foreground">Desarrollo/Construccion</h3>
                      <p className="text-sm text-muted-foreground">
                        Selecciona hasta 3 actividades ({lessonWizardData.moments.desarrollo.activities?.length || 0}/3 seleccionadas)
                      </p>
                    </div>
                    <div className="space-y-2">
                      {activitiesByMoment.desarrollo.map((activity) => {
                        const isSelected = lessonWizardData.moments.desarrollo.activities?.includes(activity.id);
                        const isDisabled = (lessonWizardData.moments.desarrollo.activities?.length || 0) >= 3;
                        return renderDesarrolloActivityCard(activity, isSelected, isDisabled);
                      })}
                    </div>
                  </div>

                  {/* Cierre Section */}
                  <div className="space-y-3 activity-card-bg rounded-2xl p-4">
                    <div>
                      <h3 className="body-1-medium text-secondary-foreground">Cierre/Metacognicion</h3>
                      <p className="text-sm text-muted-foreground">Selecciona 1 actividad para el cierre de la clase</p>
                    </div>
                    <div className="space-y-2">
                      {activitiesByMoment.cierre.map((activity) => {
                        const isSelected = lessonWizardData.moments.cierre.activities?.includes(activity.id);
                        return renderActivityCard(activity, 'cierre', isSelected);
                      })}
                    </div>
                  </div>
                </div>

                {/* Right column - Customization Panel */}
                <div className="w-80 flex-shrink-0">
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
              <Button onClick={handleCreatePlan} disabled={!allMomentsValid} className="cursor-pointer">
                Planificar clase
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
