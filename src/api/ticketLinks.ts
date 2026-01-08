import apiClient from './client';
import type { Ticket } from '../types';

export enum LinkType {
  BLOCKS = 'BLOCKS',
  BLOCKED_BY = 'BLOCKED_BY',
  RELATES_TO = 'RELATES_TO',
  DUPLICATE = 'DUPLICATE',
  DEPENDS_ON = 'DEPENDS_ON',
}

export interface TicketLink {
  id: number;
  source_ticket_id: number;
  target_ticket_id: number;
  link_type: LinkType;
  created_by_id: number;
  created_at: string;
  target_ticket: Ticket;
}

export interface TicketLinkCreate {
  target_ticket_id: number;
  link_type: LinkType;
}

export const ticketLinksApi = {
  getTicketLinks: async (ticketId: number): Promise<TicketLink[]> => {
    const response = await apiClient.get<TicketLink[]>(`/api/v1/tickets/${ticketId}/links`);
    return response.data;
  },

  createTicketLink: async (ticketId: number, linkData: TicketLinkCreate): Promise<TicketLink> => {
    const response = await apiClient.post<TicketLink>(`/api/v1/tickets/${ticketId}/links`, linkData);
    return response.data;
  },

  deleteTicketLink: async (ticketId: number, linkId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tickets/${ticketId}/links/${linkId}`);
  },
};


