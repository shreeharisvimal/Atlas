export enum SystemRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum Designation {
  DEVELOPER = "DEVELOPER",
  TESTER = "TESTER",
  QA = "QA",
  TEAM_LEAD = "TEAM_LEAD",
  PROJECT_MANAGER = "PROJECT_MANAGER",
}

export enum IssueType {
  BUG = "BUG",
  TASK = "TASK",
  IMPROVEMENT = "IMPROVEMENT",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  IN_TESTING = "IN_TESTING",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
}

export enum NotificationType {
  TICKET_CREATED = "TICKET_CREATED",
  TICKET_ASSIGNED = "TICKET_ASSIGNED",
  TICKET_STATUS_CHANGED = "TICKET_STATUS_CHANGED",
  TICKET_COMMENTED = "TICKET_COMMENTED",
  TICKET_UPDATED = "TICKET_UPDATED",
  TICKET_WATCHED = "TICKET_WATCHED",
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  system_role: SystemRole;
  designation: Designation;
  is_active: boolean;
  profile_picture_url?: string | null;
  last_seen_at?: string | null;
  is_online?: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  page_url: string | null;
  issue_type: IssueType;
  priority: Priority;
  status: TicketStatus;
  created_by_id: number;
  assigned_to_id: number | null;
  project_id: number | null;
  sprint_id: number | null;
  created_at: string;
  updated_at: string | null;
  creator: User;
  assignee: User | null;
  project: Project | null;
  sprint: Sprint | null;
}

export interface Comment {
  id: number;
  content: string;
  ticket_id: number;
  author_id: number;
  parent_comment_id: number | null; // For threading
  created_at: string;
  author: User;
  replies?: Comment[]; // For nested replies
}

export interface ActivityLog {
  id: number;
  ticket_id: number;
  user_id: number;
  action: string;
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  key: string;
  site_link: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Sprint {
  id: number;
  name: string;
  description: string | null;
  project_id: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  goal: string | null;
  created_at: string;
  updated_at: string | null;
  project: Project | null;
}

export interface TicketCreate {
  title: string;
  description: string;
  page_url?: string | null;
  issue_type: IssueType;
  priority: Priority;
  assigned_to_id?: number | null;
  project_id?: number | null;
  sprint_id?: number | null;
}

export interface TicketUpdate {
  title?: string;
  description?: string;
  page_url?: string | null;
  issue_type?: IssueType;
  priority?: Priority;
  assigned_to_id?: number | null;
  project_id?: number | null;
  sprint_id?: number | null;
}

export interface TicketStatusUpdate {
  status: TicketStatus;
}

export interface CommentCreate {
  content: string;
  ticket_id: number;
  parent_comment_id?: number | null;
}

export interface TicketWatcher {
  id: number;
  ticket_id: number;
  user_id: number;
  created_at: string;
  user: User;
}

export interface Notification {
  id: number;
  user_id: number;
  ticket_id: number | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
}

export interface Attachment {
  id: number;
  ticket_id: number;
  uploaded_by_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
  uploaded_by: User;
}

// Phase 3 Types
export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface UserPreference {
  id: number;
  user_id: number;
  theme: string; // 'light' | 'dark' | 'system'
  email_notifications: boolean;
  in_app_notifications: boolean;
  default_filters: Record<string, any> | null; // JSON object
  language: string;
  created_at: string;
  updated_at: string | null;
}

export interface TicketHistory {
  id: number;
  ticket_id: number;
  user_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string; // 'CREATE' | 'UPDATE' | 'DELETE'
  metadata: Record<string, any> | null;
  created_at: string;
  user: User;
}

// Ticket interface with all Phase 3 features
export interface Ticket {
  id: number;
  title: string;
  description: string;
  issue_type: IssueType;
  priority: Priority;
  status: TicketStatus;
  created_by_id: number;
  assigned_to_id: number | null;
  created_at: string;
  updated_at: string | null;
  creator: User;
  assignee: User | null;
  tags?: Tag[]; // Phase 3: Tags
}

