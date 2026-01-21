import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Send, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import type { ChatMessage } from '@/types';

export function TeacherLessonPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const planId = parseInt(id || '0');

  const {
    currentLessonPlan,
    setCurrentLessonPlan,
    teacherChatHistory,
    addTeacherChatMessage,
    clearTeacherChatHistory,
    isGenerating,
    setIsGenerating,
    categories,
    activities,
  } = useStore();

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlan();
    return () => {
      clearTeacherChatHistory();
    };
  }, [planId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teacherChatHistory]);

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
  }, [currentLessonPlan]);

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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentLessonPlan) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
    };

    addTeacherChatMessage(userMessage);
    setChatInput('');
    setIsGenerating(true);

    try {
      const response = await api.chat.sendMessage(`/teacher-lesson-plans/${planId}/chat`, {
        message: chatInput,
        history: teacherChatHistory,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: (response as any).response || 'Sin respuesta',
      };

      addTeacherChatMessage(assistantMessage);

      if ((response as any).updated_plan) {
        setCurrentLessonPlan((response as any).updated_plan);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Error al procesar el mensaje',
      };
      addTeacherChatMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentLessonPlan) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  const categoryNames = (currentLessonPlan.category_ids || []).map((catId: number) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : `Cat ${catId}`;
  });

  const getActivityNames = (momentKey: string) => {
    const moments = currentLessonPlan.moments as any;
    const activityIds = moments?.[momentKey]?.activities || [];
    return activityIds.map((actId: number) => {
      const act = activities.find((a) => a.id === actId);
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
        <button
          onClick={() => navigate(`/teacher/cs/${currentLessonPlan.course_subject_id}`)}
          className="cursor-pointer hover:opacity-70"
        >
          <X className="w-6 h-6 text-[#10182B]" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Sidebar - Chat */}
        <div className="w-80 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <h3 className="headline-1-bold text-[#10182B]">Chat Alizia</h3>
          </div>
          <div className="h-px bg-gray-200/50" />

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {teacherChatHistory.length === 0 ? (
              <div className="activity-card-bg rounded-2xl p-4">
                <h4 className="body-1-medium text-[#10182B] mb-2">Plan creado</h4>
                <p className="body-2-regular text-[#47566C]">
                  Si necesitás realizar algún cambio, podés escribirme y te ayudaremos.
                </p>
              </div>
            ) : (
              teacherChatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      msg.role === 'user' ? 'bg-[#735FE3] text-white' : 'activity-card-bg text-[#10182B]'
                    }`}
                  >
                    <p className="body-2-regular">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="activity-card-bg rounded-2xl p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="h-px bg-gray-200/50" />
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribí tu mensaje para Alizia..."
                disabled={isGenerating}
                className="w-full h-12 rounded-xl border-0 fill-primary px-4 pr-12 text-sm text-[#2C2C2C] placeholder:text-[#2C2C2C]/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSendMessage}
                disabled={isGenerating || !chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#735FE3] rounded-lg hover:bg-[#735FE3]/90 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-xs text-[#47566C]/60 mt-2 text-center">
              Alizia puede equivocarse. Siempre verificá la información importante antes de tomar decisiones.
            </p>
          </div>
        </div>

        {/* Center - AI Generated Content */}
        <div className="flex-1 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          <div className="h-px bg-gray-200/50" />
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Momentos de la clase */}
            <div className="space-y-4">
              <h3 className="headline-1-bold text-[#10182B]">Momentos de la clase</h3>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="body-2-regular text-[#47566C]">Generando contenido con IA...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {momentTypes.map((mt) => {
                    const activityNames = getActivityNames(mt.key);
                    const moments = currentLessonPlan.moments as any;
                    const generatedContent = moments?.[mt.key]?.generatedContent || '';

                    return (
                      <div key={mt.key} className="activity-card-bg rounded-2xl p-4 space-y-3">
                        <h4 className="body-1-medium text-secondary-foreground">{mt.name}</h4>
                        {activityNames.length > 0 && (
                          <div>
                            <p className="body-2-medium text-[#10182B] mb-2">Estrategias didácticas:</p>
                            <div className="flex flex-wrap gap-2">
                              {activityNames.map((name: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {generatedContent ? (
                          <div>
                            <p className="body-2-medium text-[#10182B] mb-2">Contenido generado:</p>
                            <p className="body-2-regular text-[#47566C] leading-relaxed whitespace-pre-wrap">
                              {generatedContent}
                            </p>
                          </div>
                        ) : (
                          <p className="body-2-regular text-[#47566C]/60 italic">Generando contenido con IA...</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
