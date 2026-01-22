import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, BookOpen, Image, Video, Newspaper, Palette, ChevronLeft, FileIcon } from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResourceOption {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface SourceOption {
  id: string;
  name: string;
}

const resourceOptions: ResourceOption[] = [
  {
    type: 'course_sheet',
    label: 'Ficha de catedra',
    description: 'Documento con informacion de la materia, contenidos y objetivos',
    icon: <FileText className="w-8 h-8" />,
    enabled: true,
  },
  {
    type: 'lecture_guide',
    label: 'Guia de lectura',
    description: 'Guia con preguntas orientadoras y actividades de lectura',
    icon: <BookOpen className="w-8 h-8" />,
    enabled: true,
  },
  {
    type: 'news_analysis',
    label: 'Analizar noticias',
    description: 'Analisis critico de noticias actuales',
    icon: <Newspaper className="w-8 h-8" />,
    enabled: false,
  },
  {
    type: 'art_analysis',
    label: 'Analizar obras de Arte',
    description: 'Analisis de obras artisticas y su contexto',
    icon: <Palette className="w-8 h-8" />,
    enabled: false,
  },
  {
    type: 'image',
    label: 'Imagen',
    description: 'Subir una imagen educativa',
    icon: <Image className="w-8 h-8" />,
    enabled: false,
  },
  {
    type: 'video',
    label: 'Video',
    description: 'Subir o enlazar un video',
    icon: <Video className="w-8 h-8" />,
    enabled: false,
  },
];

const sourceOptions: SourceOption[] = [
  {
    id: 'source_1',
    name: 'La importancia de la revolucion neolitica en la aparicion de nuevas formas de gestion del territorio y de sus recursos',
  },
  {
    id: 'source_2',
    name: 'Economias otras para unas ciencias sociales, politicas y economicas decoloniales y emancipatorias',
  },
  {
    id: 'source_3',
    name: 'Fuente 3',
  },
  {
    id: 'source_4',
    name: 'Fuente 4',
  },
  {
    id: 'source_5',
    name: 'Fuente 5',
  },
  {
    id: 'source_6',
    name: 'Fuente 6',
  },
];

export function CreateResourceModal({ isOpen, onClose }: CreateResourceModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'type' | 'source'>('type');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelectType = (option: ResourceOption) => {
    if (!option.enabled) return;
    setSelectedType(option.type);
    setStep('source');
  };

  const handleSelectSource = (source: SourceOption) => {
    onClose();
    navigate(`/recursos/${selectedType}/new?source=${source.id}`);
    // Reset state for next time
    setTimeout(() => {
      setStep('type');
      setSelectedType(null);
    }, 300);
  };

  const handleBack = () => {
    setStep('type');
    setSelectedType(null);
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setTimeout(() => {
      setStep('type');
      setSelectedType(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 'source' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <DialogTitle>
              {step === 'type' ? 'Crear nuevo recurso' : 'Elegir fuente'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'type' ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {resourceOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleSelectType(option)}
                disabled={!option.enabled}
                className={`
                  flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all
                  ${
                    option.enabled
                      ? 'border-muted hover:border-primary hover:bg-primary/5 cursor-pointer'
                      : 'border-muted/50 bg-muted/20 cursor-not-allowed opacity-60'
                  }
                `}
              >
                <div
                  className={`mb-3 ${option.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {option.icon}
                </div>
                <h3
                  className={`font-semibold text-sm mb-1 ${
                    option.enabled ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {option.label}
                </h3>
                <p className="text-xs text-muted-foreground text-center">
                  {option.enabled ? option.description : 'Proximamente'}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {sourceOptions.map((source) => (
              <button
                key={source.id}
                onClick={() => handleSelectSource(source)}
                className="flex items-start gap-3 p-4 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 cursor-pointer transition-all text-left"
              >
                <div className="shrink-0 mt-1">
                  <FileIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground line-clamp-3">
                  {source.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
