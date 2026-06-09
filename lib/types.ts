export type ClientStatus = 'Active' | 'On Hold' | 'Completed' | 'Closed'
export type GoalVertical = 'Ads' | 'Tech' | 'Creative'
export type TaskPriority = 'High' | 'Medium' | 'Low'
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Approved' | 'Rejected'

export interface Client {
  id: string
  name: string
  contact_name: string
  phone: string
  email: string
  status: ClientStatus
  created_at: string
}

export interface Goal {
  id: string
  client_id: string
  vertical: GoalVertical
  name: string
  description: string
  start_date: string | null
  end_date: string | null
  created_at: string
  tasks?: Task[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  client_id: string | null
  goal_id: string | null
  created_at: string
  client?: { id: string; name: string } | null
  goal?: { id: string; name: string } | null
  assignees?: TeamMember[]
}

export interface FollowUp {
  id: string
  task_id: string
  author_name: string
  content: string
  is_rejection: boolean
  created_at: string
}
