import { Users, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Course, ScheduleClass } from '@/types';

interface ScheduleGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

const DAYS = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
] as const;

type DayKey = (typeof DAYS)[number]['key'];

function getAllTimeSlots(schedule: Course['schedule']): string[] {
  if (!schedule) return [];

  const timesSet = new Set<string>();

  for (const day of DAYS) {
    const dayClasses = schedule[day.key as DayKey];
    if (dayClasses) {
      for (const cls of dayClasses) {
        timesSet.add(cls.time);
      }
    }
  }

  return Array.from(timesSet).sort((a, b) => {
    const timeA = a.split('-')[0];
    const timeB = b.split('-')[0];
    return timeA.localeCompare(timeB);
  });
}

function getClassAtTimeSlot(
  schedule: Course['schedule'],
  dayKey: DayKey,
  timeSlot: string,
): ScheduleClass | undefined {
  if (!schedule) return undefined;
  const dayClasses = schedule[dayKey];
  if (!dayClasses) return undefined;
  return dayClasses.find((cls) => cls.time === timeSlot);
}

function ScheduleCell({ scheduleClass }: { scheduleClass: ScheduleClass | undefined }) {
  if (!scheduleClass) {
    return (
      <div className="h-full min-h-[60px] bg-gray-50 rounded-lg border border-gray-100" />
    );
  }

  const isShared = !!scheduleClass.shared_with;

  if (isShared) {
    return (
      <div
        className="h-full min-h-[60px] rounded-lg p-2 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(218,213,246,0.4) 0%, rgba(1,206,170,0.3) 100%)',
          border: '1px solid rgba(1,206,170,0.4)',
        }}
      >
        <div className="absolute top-1 right-1">
          <Users className="w-3.5 h-3.5 text-[#01ceaa]" />
        </div>
        <div className="flex flex-col gap-0.5 pr-4">
          <span className="text-xs font-medium text-gray-700 leading-tight">
            {scheduleClass.subject}
          </span>
          <span className="text-xs text-gray-500 leading-tight">
            + {scheduleClass.shared_with}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-[60px] rounded-lg p-2"
      style={{
        background: 'rgba(218,213,246,0.2)',
        border: '1px solid rgba(218,213,246,0.5)',
      }}
    >
      <span className="text-xs font-medium text-gray-700">
        {scheduleClass.subject}
      </span>
    </div>
  );
}

export function ScheduleGridModal({ isOpen, onClose, course }: ScheduleGridModalProps) {
  const schedule = course?.schedule;
  const timeSlots = getAllTimeSlots(schedule);
  const hasSchedule = timeSlots.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Grilla de horarios - Curso {course?.name || ''}
          </DialogTitle>
        </DialogHeader>

        {/* Legend */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{
              background: 'linear-gradient(135deg, rgba(218,213,246,0.4) 0%, rgba(1,206,170,0.3) 100%)',
              border: '1px solid rgba(1,206,170,0.4)',
            }}
          >
            <Users className="w-3.5 h-3.5 text-[#01ceaa]" />
            <span className="text-xs">Clase compartida</span>
          </div>
        </div>

        {hasSchedule ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500 w-20">
                    Hora
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day.key}
                      className="p-2 text-center text-xs font-semibold text-gray-500"
                    >
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot}>
                    <td className="p-2 text-xs text-gray-500 align-top whitespace-nowrap">
                      {timeSlot}
                    </td>
                    {DAYS.map((day) => {
                      const scheduleClass = getClassAtTimeSlot(
                        schedule,
                        day.key,
                        timeSlot,
                      );
                      return (
                        <td key={day.key} className="p-1">
                          <ScheduleCell scheduleClass={scheduleClass} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay horarios definidos para este curso</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
