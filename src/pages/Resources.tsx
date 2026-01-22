import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AnimatedOrb } from '@/components/ui/AnimatedOrb';
import { ActivityCard, ActivityCardSkeleton } from '@/components/ui/ActivityCard';
import { Button } from '@/components/ui/button';
import { CreateResourceModal } from '@/components/ui/CreateResourceModal';
import { api } from '@/services/api';
import { Plus, FileText, BookOpen, Trash2 } from 'lucide-react';
import type { Resource } from '@/types';

export function Resources() {
  const navigate = useNavigate();
  const { currentUser, resources, setResources } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadResources();
    }
  }, [currentUser]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const resourcesData = await api.resources.getAll(currentUser?.id);
      setResources(resourcesData as Resource[]);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      await api.resources.delete(resourceId);
      setResources(resources.filter((r) => r.id !== resourceId));
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'lecture_guide':
        return <BookOpen className="w-5 h-5" />;
      case 'course_sheet':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'lecture_guide':
        return 'Guia de lectura';
      case 'course_sheet':
        return 'Ficha de catedra';
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full px-6 py-12">
      <div className="flex flex-col items-center mb-16 mt-8">
        <AnimatedOrb size="lg" className="mb-8" />

        <h2 className="large-title-1-regular text-primary">Recursos</h2>
        <h3 className="large-title-2-regular">Crea y gestiona tus recursos educativos</h3>
      </div>

      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6 px-4">
          <h2 className="text-xl font-semibold text-secondary-foreground">Mis recursos</h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Crear recurso
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 px-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <ActivityCardSkeleton key={index} />)
            : resources.map((resource) => (
                <div key={resource.id} className="relative group">
                  <ActivityCard
                    title={resource.title}
                    subtitle={getResourceTypeLabel(resource.resource_type)}
                    description={new Date(resource.updated_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                    onClick={() => navigate(`/recursos/${resource.id}`)}
                    icon={getResourceIcon(resource.resource_type)}
                  />
                  <button
                    onClick={(e) => handleDeleteResource(resource.id, e)}
                    className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

          {!isLoading && resources.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes recursos creados</p>
              <p className="text-sm text-muted-foreground mt-2">
                Haz clic en "Crear recurso" para comenzar
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
