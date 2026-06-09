export type ClientStatus = 'Active' | 'On Hold' | 'Completed'
export type EngagementType = 'Retainer' | 'Project'
export type EngagementVertical = 'Creative' | 'Ads' | 'Tech'
export type EngagementStatus = 'Active' | 'Completed'
export type TaskPriority = 'High' | 'Medium' | 'Low'
export type TaskStatus = 'To Do' | 'In Progress' | 'Done'

export interface Client {
  id: string
  name: string
  contact_name: string
  phone: string
  email: string
  status: ClientStatus
  created_at: string
}

export interface Engagement {
  id: string
  client_id: string
  name: string
  type: EngagementType
  vertical: EngagementVertical
  status: EngagementStatus
  created_at: string
}

export interface Task {
  id: string
  title: string
  assigned_to: string
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  client_id: string | null
  engagement_id: string | null
  created_at: string
  client?: Client
  engagement?: Engagement
}
