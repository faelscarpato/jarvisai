import * as React from 'react';
import { useJarvisStore } from '../../store';
import { googleKeepService } from '../../services/integrations/googleKeepService';
import { googleCalendarService } from '../../services/integrations/googleCalendarService';
import { googleGmailService } from '../../services/integrations/googleGmailService';
import { googleNewsService } from '../../services/integrations/googleNewsService';

const serviceMap = {
  googleCalendar: googleCalendarService,
  googleKeep: googleKeepService,
  googleGmail: googleGmailService,
  googleNews: googleNewsService,
};

type ServiceKey = keyof typeof serviceMap;

export const GoogleConnectionsSettings: React.FC = () => {
  const { integrations, toggleIntegration, setIntegrationStatus } = useJarvisStore();
  const [status, setStatus] = React.useState<string | null>(null);

  const handleToggle = async (service: ServiceKey) => {
    const enabled = !integrations[service];
    const handler = serviceMap[service];
    if (enabled) {
      await handler.connect();
      setIntegrationStatus({ [service]: true, lastSync: new Date().toISOString() } as any);
      setStatus(`Conectado a ${service.replace('google', 'Google ')}`);
    } else {
      await handler.disconnect();
      setIntegrationStatus({ [service]: false } as any);
      setStatus(`Desconectado de ${service.replace('google', 'Google ')}`);
    }
    toggleIntegration(service);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Integrações Google</h3>
      <p className="text-sm text-gray-500">
        Ative os escopos que deseja usar. Cada toggle dispara um fluxo OAuth (simulado nesta versão).
      </p>

      {([
        { id: 'googleKeep', label: 'Google Keep/Tasks', desc: 'Listas e anotações' },
        { id: 'googleCalendar', label: 'Google Calendar', desc: 'Compromissos e lembretes' },
        { id: 'googleGmail', label: 'Gmail', desc: 'Resumo de e-mails importantes' },
        { id: 'googleNews', label: 'Google News', desc: 'Briefings personalizados' },
      ] as { id: ServiceKey; label: string; desc: string }[]).map((service) => (
        <div
          key={service.id}
          className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5"
        >
          <div>
            <h4 className="font-medium text-white">{service.label}</h4>
            <p className="text-xs text-gray-500">{service.desc}</p>
            {integrations.lastSync && integrations[service.id] && (
              <p className="text-[11px] text-gray-500 mt-1">Último sync: {integrations.lastSync}</p>
            )}
          </div>
          <button
            onClick={() => handleToggle(service.id)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              integrations[service.id] ? 'bg-green-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                integrations[service.id] ? 'left-7' : 'left-1'
              }`}
            ></span>
          </button>
        </div>
      ))}

      {status && <p className="text-xs text-green-400">{status}</p>}
    </div>
  );
};
