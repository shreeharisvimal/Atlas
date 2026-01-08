import apiClient from './client';

export type VoteType = 1 | -1;

export interface TicketVote {
  id: number;
  ticket_id: number;
  user_id: number;
  vote_type: VoteType;
  created_at: string;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface TicketVoteCreate {
  vote_type: VoteType;
}

export interface TicketVoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  user_vote: VoteType | null;
}

export const ticketVotesApi = {
  voteTicket: async (ticketId: number, voteData: TicketVoteCreate): Promise<{ message: string; vote: TicketVote | null }> => {
    const response = await apiClient.post<{ message: string; vote: TicketVote | null }>(`/api/v1/tickets/${ticketId}/vote`, voteData);
    return response.data;
  },

  removeVote: async (ticketId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tickets/${ticketId}/vote`);
  },

  getVoteSummary: async (ticketId: number): Promise<TicketVoteSummary> => {
    const response = await apiClient.get<TicketVoteSummary>(`/api/v1/tickets/${ticketId}/vote-summary`);
    return response.data;
  },
};


