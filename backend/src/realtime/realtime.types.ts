import { AuthenticatedUser } from '../auth/auth.types';

export interface SocketAckSuccess<T> {
  success: true;
  data: T;
}

export interface SocketAckError {
  success: false;
  error: {
    message: string;
  };
}

export type SocketAckResponse<T> = SocketAckSuccess<T> | SocketAckError;

export type SocketAck<T> = (response: SocketAckResponse<T>) => void;

export interface SocketState {
  user?: AuthenticatedUser;
  joinedProjectIds?: Set<number>;
  typingProjectIds?: Set<number>;
}
