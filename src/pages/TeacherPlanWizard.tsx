import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';

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
    nuclei,
    activities,
    coordinationStatus,
  } = useStore();

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

  const toggleCategory = (categoryId: number) => {
    const idx = lessonWizardData.categoryIds.indexOf(categoryId);
    const newCategoryIds =
      idx === -1
        ? [...lessonWizardData.categoryIds, categoryId]
        : lessonWizardData.categoryIds.filter((id) => id !== categoryId);

    updateLessonWizardData({ categoryIds: newCategoryIds });
  };

  const toggleActivity = (momentKey: string, activityId: number) => {
    const moment = lessonWizardData.moments[momentKey as keyof typeof lessonWizardData.moments];
    const idx = moment.activities.indexOf(activityId);
    const newActivities =
      idx === -1 ? [...moment.activities, activityId] : moment.activities.filter((id) => id !== activityId);

    updateLessonWizardData({
      moments: {
        ...lessonWizardData.moments,
        [momentKey]: { ...moment, activities: newActivities },
      },
    });
  };

  const handleCreatePlan = async () => {
    const data = {
      course_subject_id: courseSubjectId,
      class_number: classNum,
      title: lessonWizardData.title,
      objective: lessonWizardData.objective,
      category_ids: lessonWizardData.categoryIds,
      moments: lessonWizardData.moments,
      status: 'planned',
    };

    try {
      await api.lessonPlans.create(data);
      resetLessonWizardData();
      navigate(`/teacher/cs/${courseSubjectId}`);
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      alert('Error al crear el plan de clase');
    }
  };

  const progress = (lessonWizardData.step / 2) * 100;

  const documentNucleusIds = coordinationStatus?.nucleus_ids || [];
  const nucleiNames = nuclei.filter((n) => documentNucleusIds.includes(n.id)).map((n) => n.name);
  const nucleiInfo = nucleiNames.length > 0 ? nucleiNames.join(', ') : 'Sin núcleos definidos';

  const documentCategoryIds = coordinationStatus?.category_ids || [];
  const availableCategories = categories.filter((c) => documentCategoryIds.includes(c.id));

  const momentTypes = [
    { key: 'apertura', name: 'Apertura/Motivación', description: 'Momento inicial de la clase' },
    { key: 'desarrollo', name: 'Desarrollo/Construcción', description: 'Momento central de la clase' },
    { key: 'cierre', name: 'Cierre/Metacognición', description: 'Momento final de reflexión' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(`/teacher/cs/${courseSubjectId}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Clase {classNum} - {lessonWizardData.title}
      </Button>

      <Progress value={progress} className="mb-6" />

      {lessonWizardData.step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Detalle de la clase</h2>

          <div className="space-y-2">
            <Label>Objetivo de la clase</Label>
            <Textarea
              rows={3}
              placeholder="Describe el objetivo principal de esta clase..."
              value={lessonWizardData.objective}
              onChange={(e) => updateLessonWizardData({ objective: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Núcleos disciplinares</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{nucleiInfo}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categorías a trabajar</Label>
            <p className="text-sm text-muted-foreground">
              Selecciona las categorías que trabajarás en esta clase (del documento de coordinación)
            </p>
            <div className="flex flex-wrap gap-2">
              {availableCategories.length === 0 ? (
                <span className="text-sm text-muted-foreground">No hay categorías disponibles</span>
              ) : (
                availableCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={lessonWizardData.categoryIds.includes(cat.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(`/teacher/cs/${courseSubjectId}`)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateLessonWizardData({ step: 2 })}
              disabled={lessonWizardData.categoryIds.length === 0}
            >
              Comenzar
            </Button>
          </div>
        </div>
      )}

      {lessonWizardData.step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Momentos y estrategias</h2>

          {momentTypes.map((mt) => {
            const moment = lessonWizardData.moments[mt.key as keyof typeof lessonWizardData.moments];

            return (
              <div key={mt.key} className="space-y-3 border rounded-lg p-4">
                <h4 className="font-semibold">{mt.name}</h4>
                <p className="text-sm text-muted-foreground">{mt.description}</p>

                <div className="flex flex-wrap gap-2">
                  {activities.map((act) => (
                    <Badge
                      key={act.id}
                      variant={moment.activities.includes(act.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleActivity(mt.key, act.id)}
                    >
                      {act.name}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Otros:</Label>
                  <Textarea
                    rows={2}
                    placeholder="Describe otras actividades que realizarás en este momento..."
                    value={(moment as any).customText || ''}
                    onChange={(e) =>
                      updateLessonWizardData({
                        moments: {
                          ...lessonWizardData.moments,
                          [mt.key]: { ...moment, customText: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              </div>
            );
          })}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => updateLessonWizardData({ step: 1 })}>
              Atrás
            </Button>
            <Button onClick={handleCreatePlan}>Crear clase</Button>
          </div>
        </div>
      )}
    </div>
  );
}
