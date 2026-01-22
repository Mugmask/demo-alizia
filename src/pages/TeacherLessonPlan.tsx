import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Share } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatBot } from '@/components/ui/ChatBot';
import { api } from '@/services/api';
import type { ChatMessage } from '@/types';

export function TeacherLessonPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const planId = parseInt(id || '0');

  const [editingContent, setEditingContent] = useState<{ [key: string]: string }>({});

  const {
    currentLessonPlan,
    setCurrentLessonPlan,
    teacherChatHistory,
    addTeacherChatMessage,
    clearTeacherChatHistory,
    isGenerating,
    setIsGenerating,
    activitiesByMoment,
  } = useStore();

  useEffect(() => {
    loadPlan();
    return () => {
      clearTeacherChatHistory();
    };
  }, [planId]);

  // Auto-generate content for all moments when plan loads for the first time
  useEffect(() => {
    if (currentLessonPlan && !isGenerating) {
      const moments = (currentLessonPlan as any).moments || {};
      const needsGeneration = ['apertura', 'desarrollo', 'cierre'].some(
        (moment) => !moments[moment]?.generatedContent || moments[moment]?.generatedContent.trim() === '',
      );

      if (needsGeneration) {
        handleGenerateAllMoments();
      }
    }
  }, [currentLessonPlan?.id]); // Only trigger on plan load, not on every update

  const loadPlan = async () => {
    try {
      const plan = await api.lessonPlans.getById(planId);
      setCurrentLessonPlan(plan as any);
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  const handleGenerateAllMoments = async () => {
    if (!currentLessonPlan || isGenerating) return;

    setIsGenerating(true);
    try {
      // Generate content for all three moments sequentially
      const momentTypes = ['apertura', 'desarrollo', 'cierre'];

      for (const momentType of momentTypes) {
        await api.chat.sendMessage(`/teacher-lesson-plans/${planId}/generate-moment`, {
          moment_type: momentType,
        });
      }

      // Reload the full plan to get all generated content
      const updatedPlan = await api.lessonPlans.getById(planId);
      setCurrentLessonPlan(updatedPlan as any);
    } catch (error) {
      console.error('Error generating moments:', error);
      alert('Error al generar contenido con IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
    };

    addTeacherChatMessage(userMessage);
    setIsGenerating(true);

    try {
      const result = await api.chat.sendMessage(`/teacher-lesson-plans/${planId}/chat`, {
        history: teacherChatHistory.concat(userMessage),
      });

      addTeacherChatMessage({ role: 'assistant', content: (result as any).response });

      // Update lesson plan if there were changes
      if ((result as any).plan && (result as any).changes_made && (result as any).changes_made.length > 0) {
        setCurrentLessonPlan({ ...currentLessonPlan, ...(result as any).plan });
      }
    } catch (e) {
      console.error('Error sending teacher chat message:', e);
      addTeacherChatMessage({ role: 'assistant', content: 'Lo siento, hubo un error. Intenta de nuevo.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentEdit = (momentKey: string, content: string) => {
    setEditingContent((prev) => ({
      ...prev,
      [momentKey]: content,
    }));
  };

  const handleSaveContent = async (momentKey: string) => {
    try {
      const updatedContent = editingContent[momentKey];
      if (!updatedContent || !currentLessonPlan) return;

      const moments = { ...(currentLessonPlan as any).moments };
      moments[momentKey] = {
        ...moments[momentKey],
        generatedContent: updatedContent,
      };

      await api.lessonPlans.update(planId, { moments });

      // Update local state
      setCurrentLessonPlan({
        ...currentLessonPlan,
        moments,
      } as any);

      // Clear editing state for this moment
      setEditingContent((prev) => {
        const newState = { ...prev };
        delete newState[momentKey];
        return newState;
      });
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error al guardar el contenido');
    }
  };

  if (!currentLessonPlan) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  const getActivityNames = (momentKey: string) => {
    const moments = currentLessonPlan.moments as any;
    const activityIds = moments?.[momentKey]?.activities || [];
    // Get all activities from all moment types for lookup
    const allActivities = [
      ...activitiesByMoment.apertura,
      ...activitiesByMoment.desarrollo,
      ...activitiesByMoment.cierre,
    ];
    return activityIds.map((actId: number) => {
      const act = allActivities.find((a) => a.id === actId);
      return act ? act.name : `Act ${actId}`;
    });
  };

  const momentTypes = [
    { key: 'apertura', name: 'Apertura/Motivación' },
    { key: 'desarrollo', name: 'Desarrollo/Construcción' },
    { key: 'cierre', name: 'Cierre/Metacognición' },
  ];

  return (
    <div className="h-screen flex flex-col gradient-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
        <button
          onClick={() => navigate(`/teacher/cs/${currentLessonPlan.course_subject_id}`)}
          className="cursor-pointer hover:opacity-70"
        >
          <ChevronLeft className="w-6 h-6 text-[#10182B]" />
        </button>
        <h1 className="title-2-bold text-[#10182B]">Planificación de clase</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {}}
            className="flex items-center gap-2 text-primary bg-muted border-none cursor-pointer rounded-xl hover:bg-muted hover:text-primary"
          >
            <Share className="w-4 h-4 text-primary" />
            Compartir
          </Button>
          <button
            onClick={() => navigate(`/teacher/cs/${currentLessonPlan.course_subject_id}`)}
            className="cursor-pointer hover:opacity-70"
          >
            <X className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Sidebar - Chat */}
        <div className="w-80 flex flex-col">
          <ChatBot
            messages={teacherChatHistory}
            onSendMessage={handleChatMessage}
            isGenerating={isGenerating}
            placeholder="Escribí tu mensaje para Alizia..."
            welcomeMessage={{
              title: 'Clase creada',
              content: 'Si necesitás realizar algún cambio, podés escribirme y lo ajustamos.',
            }}
          />
        </div>

        {/* Center - AI Generated Content */}
        <div className="flex-1 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          <div className="h-px bg-gray-200/50" />
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Momentos de la clase */}
            <div>
              <div className="p-4 px-6 border-b border-muted flex flex-row items-center justify-between">
                <h3 className="headline-1-bold text-[#10182B]">Momentos de la clase</h3>
              </div>
              <div className="space-y-4 p-4">
                {momentTypes.map((mt) => {
                  const activityNames = getActivityNames(mt.key);
                  const moments = currentLessonPlan.moments as any;
                  const generatedContent = moments?.[mt.key]?.generatedContent || '';

                  return (
                    <div key={mt.key} className="activity-card-bg rounded-2xl p-4 space-y-3">
                      <h4 className="body-1-medium text-secondary-foreground">{mt.name}</h4>
                      {activityNames.length > 0 && (
                        <div>
                          <p className="body-2-medium text-[#10182B] mb-2">Actividades:</p>
                          <div className="flex flex-wrap gap-2">
                            {activityNames.map((name: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs fill-primary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {generatedContent ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="body-2-medium text-[#10182B] mb-2">Contenido generado:</p>
                            <button
                              onClick={() => handleContentEdit(mt.key, generatedContent)}
                              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>
                          {editingContent[mt.key] !== undefined ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingContent[mt.key]}
                                onChange={(e) => handleContentEdit(mt.key, e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm text-[#47566C] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={8}
                                placeholder="Editá el contenido generado..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveContent(mt.key)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingContent((prev) => {
                                      const newState = { ...prev };
                                      delete newState[mt.key];
                                      return newState;
                                    });
                                  }}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="body-2-regular text-[#47566C] leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                              onClick={() => handleContentEdit(mt.key, generatedContent)}
                              title="Clic para editar"
                            >
                              {generatedContent}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="body-2-regular text-[#47566C]/60 italic">Generando contenido con IA...</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
