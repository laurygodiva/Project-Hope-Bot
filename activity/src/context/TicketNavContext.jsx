import { createContext, useContext, useState } from 'react';

const TicketNavContext = createContext(null);

export function TicketNavProvider({ children }) {
  const [request, setRequest] = useState(null);

  function requestOpenTicket(ticketId, category) {
    setRequest({ ticketId, category, at: Date.now() });
  }

  function clearRequest() {
    setRequest(null);
  }

  return (
    <TicketNavContext.Provider value={{ request, requestOpenTicket, clearRequest }}>{children}</TicketNavContext.Provider>
  );
}

export function useTicketNav() {
  const ctx = useContext(TicketNavContext);
  if (!ctx) throw new Error('useTicketNav debe usarse dentro de TicketNavProvider');
  return ctx;
}
