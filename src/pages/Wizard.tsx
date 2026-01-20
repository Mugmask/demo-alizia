import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, X, Minus, Plus, HelpCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export function Wizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = parseInt(id || '0');

  const { wizardData, updateWizardData, resetWizardData, subjects, nuclei, knowledgeAreas, categories, courses } =
    useStore();
  const getUserArea = useStore((state) => state.getUserArea());

  const currentCourse = courses.find((c) => c.id === courseId);
  const areaSubjects = getUserArea ? subjects.filter((s) => s.area_id === getUserArea.id) : [];

  useEffect(() => {
    if (getUserArea && nuclei.length > 0) {
      // Get all nuclei IDs for the area to show all categories
      const areaNucleiIds = nuclei.map((n) => n.id);

      // Only update if not already set
      if (wizardData.nucleusIds.length === 0) {
        updateWizardData({
          areaId: getUserArea.id,
          name: getUserArea.name,
          nucleusIds: areaNucleiIds,
        });
      }
    }
  }, [getUserArea, nuclei]);

  useEffect(() => {
    if (wizardData.startDate && wizardData.endDate && areaSubjects.length > 0) {
      const start = new Date(wizardData.startDate);
      const end = new Date(wizardData.endDate);

      if (start < end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = diffDays / 7;

        const newSubjectsData = { ...wizardData.subjectsData };
        let hasChanges = false;

        areaSubjects.forEach((subject) => {
          let classesPerWeek = 0;

          if (currentCourse?.schedule) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

            days.forEach((day) => {
              const daySchedule = currentCourse.schedule?.[day];
              if (daySchedule) {
                const subjectClasses = daySchedule.filter((scheduleClass) => scheduleClass.subject === subject.name);
                classesPerWeek += subjectClasses.length;
              }
            });
          }

          if (classesPerWeek === 0) {
            classesPerWeek = 1;
          }

          const totalClasses = Math.ceil(diffWeeks * classesPerWeek);
          const currentCount = newSubjectsData[subject.id]?.class_count || 0;

          // Solo actualizar si el valor calculado es diferente
          if (currentCount !== totalClasses) {
            newSubjectsData[subject.id] = {
              ...(newSubjectsData[subject.id] || {}),
              class_count: totalClasses,
            };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          updateWizardData({ subjectsData: newSubjectsData });
        }
      }
    }
  }, [wizardData.startDate, wizardData.endDate, areaSubjects, currentCourse]);

  const getFilteredCategories = () => {
    if (wizardData.nucleusIds.length === 0) return [];

    const knowledgeAreaIds = knowledgeAreas
      .filter((ka) => wizardData.nucleusIds.includes(ka.nucleus_id))
      .map((ka) => ka.id);

    return categories.filter((c) => knowledgeAreaIds.includes(c.knowledge_area_id));
  };

  const handleCreateDocument = async () => {
    const subjectsData: Record<string, any> = { ...wizardData.subjectsData };

    for (const [subjectId, categoryIds] of Object.entries(wizardData.subjectCategories)) {
      if (!subjectsData[subjectId]) {
        subjectsData[subjectId] = { class_count: 1 };
      }
      subjectsData[subjectId].category_ids = [...categoryIds];
    }

    const data = {
      name: wizardData.name,
      area_id: wizardData.areaId,
      start_date: wizardData.startDate,
      end_date: wizardData.endDate,
      methodological_strategies: null,
      subjects_data: Object.keys(subjectsData).length > 0 ? subjectsData : null,
      nucleus_ids: wizardData.nucleusIds,
      category_ids: wizardData.categoryIds,
    };

    try {
      const response = (await api.documents.create(data)) as { id: number };
      resetWizardData();
      navigate(`/doc/${response.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error al crear el documento');
    }
  };

  const progress = (wizardData.step / 3) * 100;
  const filteredCategories = getFilteredCategories();

  // Validaciones
  const canAdvanceFromStep2 = wizardData.startDate && wizardData.endDate;
  const allSubjectsHaveCategories = areaSubjects.every(
    (subject) => wizardData.subjectCategories[subject.id]?.length > 0,
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
              resetWizardData();
              navigate(`/curso/${courseId}`);
            }}
            className="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-900 transition-colors z-10"
          >
            <X className="w-6 h-6 cursor-pointer" />
          </button>

          <Progress value={progress} className="mb-6 h-2" />

          {wizardData.step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="title-2-bold text-[#2C2C2C]">Detalles del documento de coordenadas</h2>
                <p className="body-2-regular text-[#2C2C2C]">
                  Antes de comenzar, revisá el marco del área sobre el que se construye este documento.
                </p>
              </div>

              <div className="activity-card-bg p-4 space-y-2 rounded-2xl">
                <div className="mb-6">
                  <h3 className="headline-1-bold text-secondary-foreground mb-2">Conocimiento y saber</h3>
                  <p className="body-2-regular text-secondary-foreground">Revolución Negra de Haití</p>
                </div>

                <div className="h-px bg-[#DAD5F6]" />

                <div className="py-4">
                  <h3 className="headline-1-bold text-secondary-foreground mb-2">Núcleo problemático del área</h3>
                  <p className="body-2-regular text-secondary-foreground">
                    Las y los sujetos subalternizados problematizan lo naturalizado y construyen, desde sus resistencias
                    y luchas, la posibilidad de buenos vivires en torno al reconocimiento de las otredades
                    interseccionadas, visibilizando la multiplicidad de conocimientos y construcciones colectivas que
                    buscan resolver las problemáticas sociales, territoriales, ambientales, políticas y económicas,
                    empoderando subjetividad-es y comunidades en horizontes emancipadores.
                  </p>
                </div>

                <div className="h-px bg-[#DAD5F6]" />

                <div className="py-4">
                  <h3 className="headline-1-bold text-secondary-foreground mb-2">Categorías a trabajar</h3>
                  <ul className="space-y-1">
                    {filteredCategories.map((c) => (
                      <li key={c.id} className="body-2-regular text-secondary-foreground flex items-start">
                        <span className="mr-2">•</span>
                        <span>{c.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {wizardData.step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="title-2-bold text-[#2C2C2C]">Fechas y clases</h2>
                <p className="body-2-regular text-[#2C2C2C]">
                  Definí el período de trabajo y cuántas clases va a tener este contenido en cada disciplina.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-[#10182B] headline-1-bold">Período de trabajo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label className="text-[#10182B]">Fecha de inicio</Label>
                    <DateInput
                      value={wizardData.startDate}
                      onChange={(e) => updateWizardData({ startDate: e.target.value })}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label className="text-[#10182B] ">Fecha de fin</Label>
                    <DateInput
                      value={wizardData.endDate}
                      onChange={(e) => updateWizardData({ endDate: e.target.value })}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[#10182B] headline-1-bold">Clases por disciplina</h3>
                  <HelpCircle className="w-4 h-4 text-[#10182B]" />
                </div>
                <div className="space-y-3">
                  {areaSubjects.map((s) => {
                    const currentCount = wizardData.subjectsData[s.id]?.class_count || 0;
                    return (
                      <div key={s.id} className="flex items-center justify-between bg-[#FFFFFF4D] rounded-lg p-4">
                        <Label className="text-secondary-foreground body-2-medium">{s.name}</Label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentCount > 0) {
                                const newSubjectsData = { ...wizardData.subjectsData };
                                newSubjectsData[s.id] = {
                                  ...(newSubjectsData[s.id] || {}),
                                  class_count: currentCount - 1,
                                };
                                updateWizardData({ subjectsData: newSubjectsData });
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center transition-colors border-2 border-[#E4E8EF] rounded-lg cursor-pointer"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-8 text-center text-[#2C2C2C] font-medium">{currentCount}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newSubjectsData = { ...wizardData.subjectsData };
                              newSubjectsData[s.id] = {
                                ...(newSubjectsData[s.id] || {}),
                                class_count: currentCount + 1,
                              };
                              updateWizardData({ subjectsData: newSubjectsData });
                            }}
                            className="w-8 h-8 flex rounded-lg items-center justify-center bg-white/60 border-gray-100 border-2 transition-colors cursor-pointer"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {wizardData.step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="title-2-bold text-[#2C2C2C]">Categorías por disciplina</h2>
                <p className="body-2-regular text-[#2C2C2C]">
                  Definí qué categorías va a trabajar cada materia en este contenido.
                </p>
              </div>

              <div className="space-y-6">
                {areaSubjects.map((subject) => {
                  const selectedCategoryIds = wizardData.subjectCategories[subject.id] || [];

                  return (
                    <div key={subject.id} className="space-y-3 activity-card-bg rounded-2xl p-4">
                      <h3 className="body-1-medium text-secondary-foreground">{subject.name}</h3>
                      <div className="flex flex-wrap gap-4">
                        {filteredCategories.map((category) => {
                          const isSelected = selectedCategoryIds.includes(category.id);

                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                const newSubjectCategories = { ...wizardData.subjectCategories };
                                if (!newSubjectCategories[subject.id]) {
                                  newSubjectCategories[subject.id] = [];
                                }

                                if (isSelected) {
                                  newSubjectCategories[subject.id] = newSubjectCategories[subject.id].filter(
                                    (id: number) => id !== category.id,
                                  );
                                } else {
                                  newSubjectCategories[subject.id].push(category.id);
                                }

                                updateWizardData({ subjectCategories: newSubjectCategories });
                              }}
                              className={cn(
                                'px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                                isSelected
                                  ? 'bg-[#735FE3] text-white hover:bg-[#735FE3]/90'
                                  : 'fill-primary text-[#47566C]',
                              )}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer with buttons */}
      <div className="relative backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {wizardData.step === 1 && (
            <div className="flex justify-end">
              <Button onClick={() => updateWizardData({ step: 2 })} className="gap-2 cursor-pointer">
                Comenzar
                <ArrowRight />
              </Button>
            </div>
          )}

          {wizardData.step === 2 && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => updateWizardData({ step: 1 })}
                className="text-primary font-medium cursor-pointer hover:underline"
              >
                Anterior
              </button>
              <Button
                onClick={() => updateWizardData({ step: 3 })}
                disabled={!canAdvanceFromStep2}
                className="cursor-pointer"
              >
                Crear documento
              </Button>
            </div>
          )}

          {wizardData.step === 3 && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => updateWizardData({ step: 2 })}
                className="text-primary font-medium cursor-pointer hover:underline"
              >
                Anterior
              </button>
              <Button onClick={handleCreateDocument} disabled={!allSubjectsHaveCategories} className="cursor-pointer">
                Crear documento
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
