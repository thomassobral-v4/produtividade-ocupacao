import { TimeEntry } from '../types';
import { supabase } from '../lib/supabase';

export interface EkyteSyncRequest {
  startDate?: string;
  endDate?: string;
}

export interface EkyteSyncResponse {
  entries: TimeEntry[];
  entriesCount: number;
  startDate: string;
  endDate: string;
}

type SerializedTimeEntry = Omit<TimeEntry, 'date'> & {
  date: string;
};

type SerializedEkyteSyncResponse = Omit<EkyteSyncResponse, 'entries'> & {
  entries: SerializedTimeEntry[];
};

export const syncEkyteData = async (request: EkyteSyncRequest): Promise<EkyteSyncResponse> => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessao expirada. Entre novamente para sincronizar a eKyte.');
  }

  const response = await fetch('/api/ekyte-sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Erro eKyte ${response.status}`);
  }

  const result = payload as SerializedEkyteSyncResponse;

  return {
    ...result,
    entries: result.entries.map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }))
  };
};
