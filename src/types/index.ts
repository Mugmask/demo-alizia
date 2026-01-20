export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Area {
  id: number;
  name: string;
  coordinator_id: number;
}

export interface ScheduleClass {
  time: string;
  subject: string;
  shared_with?: string;
}

export interface Course {
  id: number;
  name: string;
  schedule?: {
    monday?: ScheduleClass[];
    tuesday?: ScheduleClass[];
    wednesday?: ScheduleClass[];
    thursday?: ScheduleClass[];
    friday?: ScheduleClass[];
  };
}

export interface Subject {
  id: number;
  name: string;
  area_id: number;
}

export interface ProblematicNucleus {
  id: number;
  name: string;
  description?: string;
}

export interface KnowledgeArea {
  id: number;
  name: string;
  nucleus_id: number;
}

export interface Category {
  id: number;
  name: string;
  knowledge_area_id: number;
}

export interface CoordinationDocument {
  id: number;
  name: string;
  area_id: number;
  course_id: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  content?: any;
}

export interface CourseSubject {
  id: number;
  course_id: number;
  subject_id: number;
  teacher_id: number;
  subject_name: string;
  course_name: string;
}

export interface MomentType {
  id: number;
  name: string;
}

export interface Activity {
  id: number;
  name: string;
  description?: string;
}

export interface LessonPlan {
  id: number;
  course_subject_id: number;
  class_number: number;
  title: string;
  objective: string;
  knowledge_content: string;
  didactic_strategies: string;
  class_format: string;
  moments: {
    apertura: { activities: any[] };
    desarrollo: { activities: any[] };
    cierre: { activities: any[] };
  };
  category_ids: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type UserRole = 'coordinator' | 'teacher' | null;
