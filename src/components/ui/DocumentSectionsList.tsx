import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

export interface DocumentTopic {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  categoriesCount: number;
  documentId?: number;
}

export interface DocumentSection {
  id: number;
  name: string;
  topics: DocumentTopic[];
}

interface DocumentSectionsListProps {
  sections: DocumentSection[];
  isLoading?: boolean;
  onCreateDocument: (topicId: number) => void;
  onEditDocument?: (documentId: number) => void;
}

const getStatusLabel = (status: DocumentTopic['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En progreso';
    case 'completed':
      return 'Completado';
    default:
      return 'Pendiente';
  }
};

const getStatusStyles = (status: DocumentTopic['status']) => {
  const baseStyles = 'rounded-lg';
  switch (status) {
    case 'pending':
      return `${baseStyles} bg-[#DAD5F680] text-foreground hover:bg-[#DAD5F680]`;
    case 'in_progress':
      return `${baseStyles} bg-amber-100 text-amber-800 hover:bg-amber-100`;
    case 'completed':
      return `${baseStyles} bg-green-100 text-green-800 hover:bg-green-100`;
    default:
      return `${baseStyles} bg-[#DAD5F680] text-foreground hover:bg-[#DAD5F680]`;
  }
};

export function DocumentSectionsList({
  sections,
  isLoading = false,
  onCreateDocument,
  onEditDocument,
}: DocumentSectionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, topicIndex) => (
                <Card key={topicIndex} className="bg-white/60 backdrop-blur-sm border-slate-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-10 w-32 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="body-2-regular text-muted-foreground">No hay secciones configuradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <h3 className="headline-1-bold text-[#10182B]">{section.name}</h3>

          {section.topics.length === 0 ? (
            <p className="body-2-regular text-secondary-foreground">No hay temas disponibles</p>
          ) : (
            <div className="space-y-3 activity-card-bg backdrop-blur-sm p-3 rounded-2xl">
              {section.topics.map((topic) => (
                <div key={topic.id} className="bg-[#FFFFFF4D] backdrop-blur-sm rounded-2xl transition-all">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Badge className={getStatusStyles(topic.status)}>{getStatusLabel(topic.status)}</Badge>
                        <h4 className="headline-1-bold text-[#10182B]">{topic.name}</h4>
                        <p className="body-2-regular text-secondary-foreground">{topic.categoriesCount} Categorías</p>
                      </div>
                      <button
                        onClick={() =>
                          topic.documentId && onEditDocument
                            ? onEditDocument(topic.documentId)
                            : onCreateDocument(topic.id)
                        }
                        className="flex items-center gap-2 text-primary  font-medium transition-colors cursor-pointer"
                      >
                        <span>{topic.documentId ? 'Ver documento' : 'Crear documento'}</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
