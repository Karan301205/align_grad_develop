import React, { useState } from 'react';
import { Globe, Lock, Plus, Search, Users, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';

export default function CommunitySidebar({
  communities = [],
  activeCommunityId,
  onSelectCommunity,
  onOpenCreateModal,
  onOpenJoinModal,
  onSearchQueryChange,
  searchQuery
}) {
  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* Action Header Card */}
      <div className="bg-surface-container border border-outline-variant p-5 rounded-2xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Communities</h3>
              <p className="text-[10px] font-sans font-normal text-on-surface-variant">Hubs & Networks</p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-headline font-medium rounded-full">
            Live
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-all font-sans font-normal"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenCreateModal}
            className="py-2 px-3 bg-primary text-on-primary hover:bg-primary/90 rounded-xl text-xs font-bold font-sans font-normal transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
          <button
            onClick={onOpenJoinModal}
            className="py-2 px-3 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded-xl text-xs font-bold font-sans font-normal transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            Join
          </button>
        </div>
      </div>

      {/* Community List Navigation */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-4 space-y-3 shadow-xs">
        <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-on-surface-variant font-bold px-1">
          Your Networks ({communities.length})
        </h4>

        <div className="space-y-1 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {communities.map((comm) => {
            const isSelected = activeCommunityId === comm.id;
            const isGlobal = comm.type === 'GLOBAL';

            return (
              <button
                key={comm.id}
                onClick={() => onSelectCommunity(comm.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden ${
                  isSelected
                    ? 'bg-on-primary/10 border-on-primary/20 text-on-primary'
                    : 'bg-surface-container-high border-outline-variant text-primary'
                }`}>
                  {comm.logo ? (
                    <img src={comm.logo} alt={comm.name} className="w-full h-full object-cover" />
                  ) : isGlobal ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    comm.name?.charAt(0) || 'C'
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold truncate">{comm.name}</p>
                    {isGlobal && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-headline font-medium shrink-0 ${
                        isSelected ? 'bg-on-primary/20 text-on-primary' : 'bg-primary/10 text-primary'
                      }`}>
                        Global
                      </span>
                    )}
                    {!isGlobal && (
                      <Lock className={`w-3 h-3 shrink-0 ${isSelected ? 'text-on-primary/80' : 'text-on-surface-variant'}`} />
                    )}
                  </div>
                  <p className={`text-[10px] truncate font-sans font-normal mt-0.5 ${isSelected ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                    {comm.role ? `Role: ${comm.role}` : (isGlobal ? 'Auto-Joined Member' : 'Member')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
