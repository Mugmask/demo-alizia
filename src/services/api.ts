const API_BASE = 'http://localhost:8000';

export async function fetchData<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

export async function postData<T>(endpoint: string, data: any): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

export async function putData<T>(endpoint: string, data: any): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteData<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  users: {
    getAll: () => fetchData('/users'),
  },
  courses: {
    getAll: () => fetchData('/courses'),
    getById: (id: number) => fetchData(`/courses/${id}`),
    getStudents: (id: number) => fetchData(`/courses/${id}/students`),
  },
  areas: {
    getAll: () => fetchData('/areas'),
  },
  subjects: {
    getAll: () => fetchData('/subjects'),
  },
  nuclei: {
    getAll: () => fetchData('/problematic-nuclei'),
  },
  knowledgeAreas: {
    getAll: () => fetchData('/knowledge-areas'),
  },
  categories: {
    getAll: () => fetchData('/categories'),
  },
  documents: {
    getAll: () => fetchData('/coordination-documents'),
    getById: (id: number) => fetchData(`/coordination-documents/${id}`),
    create: (data: any) => postData('/coordination-documents', data),
    update: (id: number, data: any) => putData(`/coordination-documents/${id}`, data),
    delete: (id: number) => deleteData(`/coordination-documents/${id}`),
    publish: (id: number) => putData(`/coordination-documents/${id}/publish`, {}),
  },
  courseSubjects: {
    getAll: () => fetchData('/course-subjects'),
    getById: (id: number) => fetchData(`/course-subjects/${id}`),
    getCoordinationStatus: (id: number) => fetchData(`/course-subjects/${id}/coordination-status`),
  },
  teachers: {
    getCourses: (teacherId: number) => fetchData(`/teachers/${teacherId}/courses`),
  },
  momentTypes: {
    getAll: () => fetchData('/moment-types'),
  },
  activities: {
    getAll: () => fetchData('/activities'),
  },
  lessonPlans: {
    getAll: () => fetchData('/lesson-plans'),
    getById: (id: number) => fetchData(`/teacher-lesson-plans/${id}`),
    getByCourseSubject: (csId: number) => fetchData(`/course-subjects/${csId}/lesson-plans`),
    create: (data: any) => postData('/teacher-lesson-plans', data),
    update: (id: number, data: any) => putData(`/teacher-lesson-plans/${id}`, data),
    delete: (id: number) => deleteData(`/teacher-lesson-plans/${id}`),
  },
  chat: {
    sendMessage: (endpoint: string, data: any) => postData(endpoint, data),
  },
};
