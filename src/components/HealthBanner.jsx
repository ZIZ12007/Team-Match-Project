import React from 'react';
import { AlertTriangle, Database, RefreshCw } from 'lucide-react';

export function HealthBanner({ health, onSeed, seeding, onRefresh }) {
  if (!health) return null;

  const isConnected = health.connected;
  const stats = health.stats || { people: 0, relationships: 0 };
  const isEmpty = isConnected && stats.people === 0;

  if (isConnected && !isEmpty) {
    return null; // All good, clean UI
  }

  return (
    <div className="border-b-2 border-[#08123B] bg-[#08123B] text-white px-4 py-3 shadow-[0_3px_0_0_#FF007A]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 font-mono-code text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-white bg-[#FF007A] text-white">
            <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            {!isConnected ? (
              <span className="font-bold text-white">
                [COGNO_DB OFFLINE] Graph database connection is currently unavailable ({health.error || 'Check server connection'}).
              </span>
            ) : (
              <span className="font-bold text-[#FF007A]">
                [GRAPH EMPTY] Connected to CognoDB instance, but 0 talent nodes are populated.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && isEmpty && (
            <button
              onClick={onSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-md border-2 border-[#08123B] bg-[#0052FF] px-3.5 py-1 font-bold text-white shadow-[2px_2px_0px_#FFFFFF] hover:bg-[#0042D9] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
            >
              {seeding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              <span>{seeding ? 'SEEDING GRAPH...' : 'POPULATE GRAPH DATA'}</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="rounded-md border-2 border-white bg-white px-3 py-1 font-bold text-[#08123B] shadow-[2px_2px_0px_#FF007A] hover:bg-[#F4F6FB] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
          >
            RETRY
          </button>
        </div>
      </div>
    </div>
  );
}
