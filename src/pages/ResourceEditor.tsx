import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, X, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ChatBot } from '@/components/ui/ChatBot';
import { api } from '@/services/api';
import type { Resource, ChatMessage } from '@/types';

const SOURCE_NAMES: Record<string, string> = {
  source_1: 'La importancia de la revolucion neolitica',
  source_2: 'Economias otras - Ciencias decoloniales',
  source_3: 'Fuente 3',
  source_4: 'Fuente 4',
  source_5: 'Fuente 5',
  source_6: 'Fuente 6',
};

export function ResourceEditor() {
  const { id, type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, currentResource, setCurrentResource } = useStore();
  const sourceId = searchParams.get('source');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const isNewResource = id === undefined && type !== undefined;
  const resourceId = id ? parseInt(id) : null;

  useEffect(() => {
    if (isNewResource && type && currentUser) {
      createNewResource();
    } else if (resourceId) {
      loadResource();
    }

    return () => {
      setCurrentResource(null);
    };
  }, [resourceId, type, currentUser]);

  const createNewResource = async () => {
    if (!currentUser || !type) return;

    setIsLoading(true);
    try {
      // Simulate loading for better UX
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const sourceName = sourceId ? SOURCE_NAMES[sourceId] || 'Recurso' : '';
      const typeLabel = type === 'lecture_guide' ? 'Guia de Lectura' : 'Ficha de Catedra';
      const defaultTitle = sourceName ? `${typeLabel} - ${sourceName}` : typeLabel;

      const newResource = await api.resources.create({
        title: defaultTitle,
        resource_type: type,
        user_id: currentUser.id,
      });

      setCurrentResource(newResource as Resource);
      setTitleValue((newResource as Resource).title);

      // Redirect to the edit URL
      navigate(`/recursos/${(newResource as Resource).id}`, { replace: true });
    } catch (error) {
      console.error('Error creating resource:', error);
      navigate('/recursos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadResource = async () => {
    if (!resourceId) return;

    setIsLoading(true);
    try {
      const resource = await api.resources.getById(resourceId);
      setCurrentResource(resource as Resource);
      setTitleValue((resource as Resource).title);
    } catch (error) {
      console.error('Error loading resource:', error);
      navigate('/recursos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!currentResource) return;
    setCurrentResource({ ...currentResource, content: newContent });
  };

  const handleContentBlur = async () => {
    if (!currentResource || !resourceId) return;

    setIsSaving(true);
    try {
      await api.resources.update(resourceId, { content: currentResource.content || '' });
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleSave = async () => {
    if (!currentResource || !resourceId || !titleValue.trim()) return;

    setIsSaving(true);
    try {
      await api.resources.update(resourceId, { title: titleValue.trim() });
      setCurrentResource({ ...currentResource, title: titleValue.trim() });
      setEditingTitle(false);
    } catch (error) {
      console.error('Error saving title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, userMessage]);

    // For now, just add a placeholder response since there's no chat endpoint for resources
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Esta funcionalidad de chat para recursos estara disponible proximamente. Por ahora, podes editar el contenido directamente en el editor.',
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const getResourceTypeLabel = (resourceType: string) => {
    switch (resourceType) {
      case 'lecture_guide':
        return 'Guia de Lectura';
      case 'course_sheet':
        return 'Ficha de Catedra';
      default:
        return 'Recurso';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gradient-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-secondary-foreground">
          {isNewResource ? 'Generando recurso...' : 'Cargando recurso...'}
        </p>
      </div>
    );
  }

  if (!currentResource) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gradient-background">
        <p className="text-lg text-secondary-foreground">Recurso no encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-muted bg-[#FFFFFF26] backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/recursos')} className="cursor-pointer hover:opacity-70">
            <ChevronLeft className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
        <h1 className="title-2-bold text-[#10182B]">
          {getResourceTypeLabel(currentResource.resource_type)}
        </h1>
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </span>
          )}
          <button onClick={() => navigate('/recursos')} className="cursor-pointer hover:opacity-70">
            <X className="w-6 h-6 text-[#10182B]" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Sidebar - Chat */}
        <div className={`${isChatCollapsed ? 'w-12' : 'w-80'} flex flex-col transition-all duration-300 ease-in-out`}>
          <ChatBot
            messages={chatHistory}
            onSendMessage={handleChatMessage}
            isGenerating={false}
            placeholder="Pregunta sobre el recurso..."
            welcomeMessage={{
              title: 'Editor de recursos',
              content: 'Podes editar el contenido directamente. El chat con IA estara disponible proximamente.',
            }}
            isCollapsed={isChatCollapsed}
            onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
          />
        </div>

        {/* Center - Content Editor */}
        <div className="flex-1 flex flex-col activity-card-bg rounded-2xl overflow-hidden">
          {/* Title Header */}
          <div className="p-4 px-6 border-b border-muted flex items-center h-14">
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="headline-1-bold text-[#10182B] bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 px-1 py-0 flex-1"
                  placeholder="Titulo del recurso"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setTitleValue(currentResource.title);
                    setEditingTitle(false);
                  }}
                  className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h2
                  className="headline-1-bold text-[#10182B] cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                  onClick={() => setEditingTitle(true)}
                  title="Clic para editar"
                >
                  {currentResource.title}
                </h2>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden p-6">
            <textarea
              value={currentResource.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              onBlur={handleContentBlur}
              className="w-full h-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm leading-relaxed"
              placeholder="Escribe el contenido del recurso en formato Markdown..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
