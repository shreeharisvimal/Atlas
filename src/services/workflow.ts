import { SystemRole, Designation, TicketStatus } from '../types';

export class WorkflowService {
  static canTransitionStatus(
    currentStatus: TicketStatus,
    newStatus: TicketStatus,
    userDesignation: Designation,
    userRole: SystemRole,
    isAssignedUser: boolean
  ): boolean {
    // VIEWER cannot modify anything
    if (userRole === SystemRole.VIEWER) {
      return false;
    }

    // ADMIN and MANAGER can move to any status
    if (userRole === SystemRole.ADMIN || userRole === SystemRole.MANAGER) {
      return true;
    }

    // Only assigned user can update status (except for TEAM_LEAD, PROJECT_MANAGER, and TESTER/QA when moving from IN_TESTING)
    // Testers/QA can move tickets from IN_TESTING regardless of assignment (they check and decide)
    if (currentStatus === TicketStatus.IN_TESTING && (userDesignation === Designation.TESTER || userDesignation === Designation.QA)) {
      // Testers can move tickets from IN_TESTING to any status - handled below
    } else if (!isAssignedUser && userDesignation !== Designation.TEAM_LEAD && userDesignation !== Designation.PROJECT_MANAGER) {
      return false;
    }

    // TEAM_LEAD and PROJECT_MANAGER can move to any status
    if (userDesignation === Designation.TEAM_LEAD || userDesignation === Designation.PROJECT_MANAGER) {
      return true;
    }

    // DEVELOPER workflow
    if (userDesignation === Designation.DEVELOPER) {
      const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
        [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
        [TicketStatus.IN_PROGRESS]: [TicketStatus.REVIEW],
        [TicketStatus.REVIEW]: [TicketStatus.IN_PROGRESS],
        [TicketStatus.IN_TESTING]: [],
        [TicketStatus.BLOCKED]: [],
        [TicketStatus.DONE]: [],
      };
      return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    }

    // TESTER and QA workflow - can change TESTING status to ANY status (they check and decide)
    if (userDesignation === Designation.TESTER || userDesignation === Designation.QA) {
      // Testers can move tickets from IN_TESTING to ANY status (they are the ones who check and decide)
      if (currentStatus === TicketStatus.IN_TESTING) {
        return true; // Allow transition to any status from IN_TESTING
      }
      
      // Other allowed transitions for testers
      const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
        [TicketStatus.REVIEW]: [TicketStatus.IN_TESTING],
        [TicketStatus.DONE]: [TicketStatus.REVIEW, TicketStatus.IN_TESTING], // Can reopen
        [TicketStatus.OPEN]: [],
        [TicketStatus.IN_PROGRESS]: [],
        [TicketStatus.BLOCKED]: [],
      };
      return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    }

    return false;
  }

  static canUpdateStatus(
    _currentStatus: TicketStatus,
    userDesignation: Designation,
    userRole: SystemRole,
    isAssignedUser: boolean
  ): boolean {
    // This is a simplified check - actual validation happens on backend
    if (userRole === SystemRole.VIEWER) {
      return false;
    }
    if (userRole === SystemRole.ADMIN || userRole === SystemRole.MANAGER) {
      return true;
    }
    if (userDesignation === Designation.TEAM_LEAD || userDesignation === Designation.PROJECT_MANAGER) {
      return true;
    }
    return isAssignedUser;
  }

  static canAssignTicket(userRole: SystemRole): boolean {
    /**Check if user can assign/reassign tickets*/
    return userRole === SystemRole.ADMIN || userRole === SystemRole.MANAGER;
  }

  static canCreateTicket(userRole?: SystemRole): boolean {
    /**Any authenticated user can create tickets (except VIEWER)*/
    if (!userRole) return false;
    return userRole !== SystemRole.VIEWER;
  }
}



