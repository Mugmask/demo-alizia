import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  X,
  Mic,
  Send,
  Calendar,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
  CloudCheck,
} from 'lucide-react';
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
    expandedSubjects,
    toggleSubjectExpanded,
  } = useStore();

  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showClasses, setShowClasses] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocument();
    return () => {
      clearChatHistory();
    };
  }, [docId]);

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
      const response = await api.chat.sendMessage(`/coordination-documents/${docId}/generate`, {});

      if ((response as any).updated_document) {
        setCurrentDocument((response as any).updated_document);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTitle = async (newTitle: string) => {
    if (!currentDocument || newTitle === currentDocument.name) return;

    try {
      await api.documents.update(docId, { name: newTitle });
      setCurrentDocument({ ...currentDocument, name: newTitle });
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  if (!currentDocument) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  const categoryMap: Record<number, string> = {};
  (currentDocument.content?.categories || []).forEach((c: any) => {
    categoryMap[c.id] = c.name;
  });

  const subjectsData = currentDocument.content?.subjects_data || {};
  const subjects = currentDocument.content?.subjects || [];

  const documentCategoryIds = currentDocument.content?.category_ids || [];
  const assignedCategoryIds = new Set<number>();
  Object.values(subjectsData).forEach((sData: any) => {
    (sData.class_plan || []).forEach((c: any) => {
      (c.category_ids || []).forEach((catId: number) => assignedCategoryIds.add(catId));
    });
  });

  const unassignedCategories = documentCategoryIds
    .filter((catId: number) => !assignedCategoryIds.has(catId))
    .map((catId: number) => ({ id: catId, name: categoryMap[catId] || `Categoría ${catId}` }));

  const hasContent = currentDocument.content?.methodological_strategies?.trim().length > 0;

  return (
    <div className="h-screen flex flex-col gradient-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-70">
            <ChevronLeft className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="title-2-bold text-[#10182B]">Documento de coordenadas</h1>
          <CloudCheck />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="gap-2 text-primary">
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-70">
            <X className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Sidebar - Chat */}
        {showChat && (
          <div className="w-80 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="headline-1-bold text-[#10182B]">Chat Alizia</h3>
              <button onClick={() => setShowChat(false)} className="cursor-pointer hover:opacity-70">
                <PanelLeftClose className="w-5 h-5 text-[#10182B]" />
              </button>
            </div>
            <div className="h-px bg-gray-200/50" />

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
                  className="w-full h-12 rounded-xl border-0 fill-primary px-4 pr-20 text-sm text-[#2C2C2C] placeholder:text-[#2C2C2C]/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button className="p-2 hover:opacity-70 cursor-pointer">
                    <Mic className="w-5 h-5 text-[#47566C]" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isGenerating || !chatInput.trim()}
                    className="p-2 bg-[#735FE3] rounded-lg hover:bg-[#735FE3]/90 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#47566C]/60 mt-2 text-center">
                Alizia puede equivocarse. Siempre verificá la información importante antes de tomar decisiones.
              </p>
            </div>
          </div>
        )}

        {/* Center - Document Content */}
        <div className="flex-1 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          <div className="p-6">
            <h3 className="headline-1-bold text-[#10182B]">Contenido del documento</h3>
          </div>
          <div className="h-px bg-gray-200/50" />
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Document Info */}
            <div className="space-y-2">
              <h2 className="title-1-bold text-[#10182B]">{currentDocument.name}</h2>
              <div className="flex items-center gap-2 text-[#47566C] text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {currentDocument.start_date} - {currentDocument.end_date}
                </span>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              <div>
                <h3 className="headline-1-bold text-[#10182B] mb-3">Título sección</h3>
                <p className="body-2-regular text-[#47566C] leading-relaxed">
                  {currentDocument.content?.methodological_strategies ||
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}
                </p>
              </div>

              <div>
                <h3 className="headline-1-bold text-[#10182B] mb-3">Título sección</h3>
                <p className="body-2-regular text-[#47566C] leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum.
                </p>
              </div>

              <div>
                <h3 className="headline-1-bold text-[#10182B] mb-3">Título sección</h3>
                <p className="body-2-regular text-[#47566C] leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat.
                </p>
              </div>

              {/* Cronograma */}
              <div className="activity-card-bg rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="headline-1-bold text-[#10182B]">Cronograma de clases por disciplinas</h3>
                  <button className="flex items-center gap-2 text-primary body-2-medium cursor-pointer hover:opacity-70">
                    ver clases
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Classes */}
        {showClasses && (
          <div className="w-80 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="headline-1-bold text-[#10182B]">Clases por disciplinas</h3>
              <button onClick={() => setShowClasses(false)} className="cursor-pointer hover:opacity-70">
                <X className="w-5 h-5 text-[#10182B]" />
              </button>
            </div>
            <div className="h-px bg-gray-200/50" />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {subjects.length === 0 ? (
                <p className="body-2-regular text-[#47566C]">No hay materias configuradas</p>
              ) : (
                subjects.map((s: any) => {
                  const sData = subjectsData[s.id] || {};
                  const classPlan = sData.class_plan || [];

                  return (
                    <div key={s.id} className="space-y-2">
                      <h4 className="body-1-medium text-[#10182B]">{s.name}</h4>
                      {classPlan.length === 0 ? (
                        <p className="body-2-regular text-[#47566C]">No hay clases planificadas</p>
                      ) : (
                        <div className="space-y-2">
                          {classPlan.map((c: any) => (
                            <div key={c.class_number} className="activity-card-bg rounded-xl p-3">
                              <p className="body-2-medium text-[#10182B] mb-1">
                                Clase {c.class_number}: {c.title || 'Sin título'}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(c.category_ids || []).map((catId: number) => (
                                  <span
                                    key={catId}
                                    className="px-2 py-0.5 rounded-md bg-[#735FE3]/10 text-[#735FE3] text-xs"
                                  >
                                    {categoryMap[catId] || `Cat ${catId}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
