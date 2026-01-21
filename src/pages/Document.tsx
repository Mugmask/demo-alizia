import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Share2, X, Send, Calendar, Loader2, Share } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import type { CoordinationDocument, ChatMessage } from '@/types';

export function Document() {
  const { id } = useParams();
  const navigate = useNavigate();
  const docId = parseInt(id || '0');

  const {
    currentDocument,
    setCurrentDocument,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    isGenerating,
    setIsGenerating,
  } = useStore();

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocument();
    return () => {
      clearChatHistory();
    };
  }, [docId]);

  // Auto-generate content when document loads for the first time
  useEffect(() => {
    if (currentDocument && !hasContent && !isGenerating) {
      handleGenerateContent();
    }
  }, [currentDocument]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadDocument = async () => {
    try {
      const doc = await api.documents.getById(docId);
      setCurrentDocument(doc as CoordinationDocument);
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentDocument) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
    };

    addChatMessage(userMessage);
    setChatInput('');
    setIsGenerating(true);

    try {
      const response = await api.chat.sendMessage(`/coordination-documents/${docId}/chat`, {
        message: chatInput,
        history: chatHistory,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: (response as any).response || 'Sin respuesta',
      };

      addChatMessage(assistantMessage);

      if ((response as any).updated_document) {
        setCurrentDocument((response as any).updated_document);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Error al procesar el mensaje',
      };
      addChatMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!currentDocument) return;

    setIsGenerating(true);
    try {
      await api.chat.sendMessage(`/coordination-documents/${docId}/generate`, {});

      // Reload the full document to get all generated content including class plans
      const updatedDoc = await api.documents.getById(docId);
      setCurrentDocument(updatedDoc as CoordinationDocument);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error al generar contenido con IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveClassTitle = async (subjectId: number, classNumber: number, newTitle: string) => {
    if (!currentDocument) return;

    const subjectsData = { ...(currentDocument as any).subjects_data };
    if (subjectsData[subjectId] && subjectsData[subjectId].class_plan) {
      const classItem = subjectsData[subjectId].class_plan.find((c: any) => c.class_number === classNumber);
      if (classItem && classItem.title !== newTitle) {
        classItem.title = newTitle;
        try {
          await api.documents.update(docId, { subjects_data: subjectsData });
          const updatedDoc = await api.documents.getById(docId);
          setCurrentDocument(updatedDoc as CoordinationDocument);
        } catch (error) {
          console.error('Error saving class title:', error);
        }
      }
    }
  };

  const handleEditStrategy = () => {
    // This would open an inline editor for the strategy
  };

  const handlePublishDocument = async () => {
    if (!currentDocument) return;

    try {
      await api.documents.publish(docId);
      const updatedDoc = await api.documents.getById(docId);
      setCurrentDocument(updatedDoc as CoordinationDocument);
      alert('Documento publicado exitosamente');
    } catch (error) {
      console.error('Error publishing document:', error);
      alert('Error al publicar el documento');
    }
  };

  if (!currentDocument) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  const categoryMap: Record<number, string> = {};
  ((currentDocument as any).categories || []).forEach((c: any) => {
    categoryMap[c.id] = c.name;
  });

  const subjectsData = (currentDocument as any).subjects_data || {};
  const subjects = (currentDocument as any).subjects || [];

  const documentCategoryIds = (currentDocument as any).category_ids || [];
  const assignedCategoryIds = new Set<number>();
  Object.values(subjectsData).forEach((sData: any) => {
    (sData.class_plan || []).forEach((c: any) => {
      (c.category_ids || []).forEach((catId: number) => assignedCategoryIds.add(catId));
    });
  });

  const unassignedCategories = documentCategoryIds
    .filter((catId: number) => !assignedCategoryIds.has(catId))
    .map((catId: number) => ({ id: catId, name: categoryMap[catId] || `Categoría ${catId}` }));

  const hasContent =
    (currentDocument as any).methodological_strategies &&
    (currentDocument as any).methodological_strategies.trim().length > 0;

  return (
    <div className="h-screen flex flex-col gradient-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-muted bg-[#FFFFFF26] backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-70">
            <ChevronLeft className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
        <h1 className="title-2-bold text-[#10182B]">Documento de coordenadas</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePublishDocument}
            className="flex items-center gap-2 text-primary bg-muted border-none cursor-pointer rounded-xl hover:bg-muted hover:text-primary"
          >
            <Share className="w-4 h-4 text-primary" />
            {currentDocument.status === 'published' ? 'Publicado' : 'Compartir'}
          </Button>
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-70">
            <X className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Sidebar - Chat */}
        <div className="w-80 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-muted flex items-center justify-between">
            <h3 className="headline-1-bold text-[#10182B]">Chat Alizia</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="activity-card-bg rounded-2xl p-4">
                <h4 className="body-1-medium text-[#10182B] mb-2">Documento creado</h4>
                <p className="body-2-regular text-[#47566C]">
                  Si necesitás realizar algún cambio, podés escribirme y te ayudaremos.
                </p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
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
          {/* Document Title Header */}
          <div className="p-4 px-6 border-b border-muted flex flex-row items-center justify-between">
            <h2 className="headline-1-bold text-[#10182B]">{currentDocument.name}</h2>
            <div className="flex items-center gap-2 text-[#47566C] text-sm">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(currentDocument.start_date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}{' '}
                -{' '}
                {new Date(currentDocument.end_date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Methodological Strategy Section */}
            <div className="space-y-4">
              <h3 className="headline-1-bold text-[#10182B]">Estrategia metodológica</h3>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="body-2-regular text-[#47566C]">Generando contenido con IA...</p>
                </div>
              ) : (
                <div
                  className="body-2-regular text-secondary-foreground whitespace-pre-wrap"
                  onDoubleClick={handleEditStrategy}
                >
                  {hasContent ? (
                    (currentDocument as any).methodological_strategies
                  ) : (
                    <p className="text-[#47566C]/60 italic">Generando contenido con IA...</p>
                  )}
                </div>
              )}

              {/* Separator */}
              {hasContent && !isGenerating && <div className="border-t border-muted my-8"></div>}

              {/* Class Schedule Section */}
              {hasContent && !isGenerating && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="headline-1-bold text-[#10182B]">Cronograma de clases por disciplinas</h3>
                    <Button className="flex items-center gap-2 text-primary bg-muted border-none cursor-pointer rounded-xl hover:bg-muted hover:text-primary">
                      Ver clases
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Classes by Discipline */}
        <div className="w-80 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-muted flex items-center justify-between">
            <h3 className="headline-1-bold text-[#10182B]">Clases por disciplinas</h3>
            <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-70">
              <X className="w-5 h-5 text-[#10182B]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {(() => {
              // Collect all classes from all subjects separately
              const allClasses: any[] = [];
              const subjectColors: Record<number, string> = {};
              const colorPalette = [
                '#8B5CF6', // purple
                '#10B981', // green
                '#F59E0B', // orange
                '#EF4444', // red
                '#3B82F6', // blue
                '#EC4899', // pink
                '#14B8A6', // teal
              ];

              subjects.forEach((s: any, idx: number) => {
                subjectColors[s.id] = colorPalette[idx % colorPalette.length];
                const sData = subjectsData[s.id] || {};
                const classPlan = sData.class_plan || [];

                classPlan.forEach((c: any) => {
                  // Add each class separately for each subject
                  allClasses.push({
                    class_number: c.class_number,
                    title: c.title || 'Título clase',
                    date: c.date || '',
                    subject_id: s.id,
                    subject_name: s.name,
                    category_ids: c.category_ids || [],
                  });
                });
              });

              // Sort classes by class_number, then by subject
              allClasses.sort((a, b) => {
                if (a.class_number !== b.class_number) {
                  return a.class_number - b.class_number;
                }
                return a.subject_name.localeCompare(b.subject_name);
              });

              // Helper function to get week date range
              const getWeekLabel = (classNumber: number, startDate: string) => {
                if (!startDate) return `Semana ${Math.floor((classNumber - 1) / 4) + 1}`;

                const start = new Date(startDate);
                const weekNumber = Math.floor((classNumber - 1) / 4);
                const weekStart = new Date(start);
                weekStart.setDate(start.getDate() + weekNumber * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const formatDate = (date: Date) => {
                  const day = date.getDate();
                  const months = [
                    'enero',
                    'febrero',
                    'marzo',
                    'abril',
                    'mayo',
                    'junio',
                    'julio',
                    'agosto',
                    'septiembre',
                    'octubre',
                    'noviembre',
                    'diciembre',
                  ];
                  return `${day} de ${months[date.getMonth()]}`;
                };

                return `Semana del ${formatDate(weekStart)} al ${formatDate(weekEnd)}`;
              };

              // Group classes by week
              const groupedByWeek: Record<string, any[]> = {};
              allClasses.forEach((c) => {
                const weekKey = getWeekLabel(c.class_number, currentDocument?.start_date || '');
                if (!groupedByWeek[weekKey]) {
                  groupedByWeek[weekKey] = [];
                }
                groupedByWeek[weekKey].push(c);
              });

              return Object.entries(groupedByWeek).map(([weekLabel, classes]) => (
                <div key={weekLabel} className="space-y-3">
                  <h4 className="body-2-medium text-[#47566C] text-sm">{weekLabel}</h4>
                  <div className="space-y-2">
                    {classes.map((c: any, idx: number) => (
                      <div
                        key={`${c.class_number}-${c.subject_id}-${idx}`}
                        className="fill-primary rounded-xl p-3 space-y-2"
                      >
                        <input
                          type="text"
                          defaultValue={c.title}
                          onBlur={(e) => {
                            handleSaveClassTitle(c.subject_id, c.class_number, e.target.value);
                          }}
                          className="w-full body-2-medium text-[#10182B] text-sm bg-transparent border-0 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: subjectColors[c.subject_id] }}
                          />
                          <span className="body-2-regular text-[#47566C] text-xs">{c.subject_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {subjects.length === 0 && (
              <p className="body-2-regular text-[#47566C] text-center">No hay materias configuradas</p>
            )}

            {/* Unassigned Categories Warning */}
            {unassignedCategories.length > 0 && (
              <div className="mt-4 fill-primary rounded-xl p-3 border-l-4 border-yellow-500">
                <div className="flex gap-2">
                  <div className="text-lg">⚠️</div>
                  <div className="flex-1">
                    <h4 className="body-2-medium text-[#10182B] mb-1 text-xs">Conceptos sin asignar:</h4>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {unassignedCategories.map((cat: { id: number; name: string }) => (
                        <span key={cat.id} className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-800 text-xs">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                    <p className="body-2-regular text-[#47566C] text-xs">Haz clic en + para asignar.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
