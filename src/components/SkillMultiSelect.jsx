import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Check,
  ChevronDown,
  X,
  Sparkles,
  Sliders,
  Layers,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';

export function SkillMultiSelect({
  allSkills = [],
  selectedSkills = [],
  onChangeSelectedSkills,
  matchMode = 'any', // 'any' | 'all'
  onChangeMatchMode,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Group and filter skills
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return allSkills;
    const q = searchQuery.toLowerCase().trim();
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
    );
  }, [allSkills, searchQuery]);

  // Group by category
  const categorizedSkills = useMemo(() => {
    const map = {};
    for (const skill of filteredSkills) {
      const cat = skill.category || 'General & Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(skill);
    }
    return map;
  }, [filteredSkills]);

  const toggleSkill = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      onChangeSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      onChangeSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleSelectAllFiltered = () => {
    const toAdd = filteredSkills.map((s) => s.name);
    const set = new Set([...selectedSkills, ...toAdd]);
    onChangeSelectedSkills(Array.from(set));
  };

  const handleClearAll = () => {
    onChangeSelectedSkills([]);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-2.5 px-3.5 rounded-lg border-2 border-[#08123B] font-mono-code text-xs font-semibold flex items-center justify-between gap-2 text-left transition-colors shadow-[2px_2px_0px_#08123B] ${
          selectedSkills.length > 0
            ? 'bg-[#0052FF] text-white'
            : 'bg-[#F4F6FB] text-[#08123B] hover:bg-[#E8EDFB]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className={`h-4 w-4 shrink-0 ${selectedSkills.length > 0 ? 'text-[#FFC700]' : 'text-[#7382A6]'}`} />
          {selectedSkills.length === 0 ? (
            <span className="truncate text-[#4A5578]">Select Skills ({allSkills.length} available)</span>
          ) : (
            <div className="flex items-center gap-1.5 truncate font-bold">
              <span>
                {selectedSkills.length} {selectedSkills.length === 1 ? 'Skill' : 'Skills'} Selected
              </span>
              <span className="hidden xl:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono-code">
                ({matchMode.toUpperCase()})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedSkills.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-0.5 rounded hover:bg-white/20 text-white transition-colors"
              title="Clear selected skills"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            } ${selectedSkills.length > 0 ? 'text-white' : 'text-[#08123B]'}`}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-full sm:w-[420px] max-w-[90vw] z-50 rounded-xl border-2 border-[#08123B] bg-white shadow-[6px_6px_0px_#08123B] flex flex-col max-h-[460px] overflow-hidden"
          >
            {/* Header: Search Box */}
            <div className="p-3 border-b-2 border-[#08123B] bg-[#F4F6FB] space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter skills by name or category..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border-2 border-[#08123B] bg-white font-mono-code text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0052FF]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#7382A6] hover:text-[#08123B]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Match Mode Controls & Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 font-mono-code text-[11px]">
                {/* Match Mode Toggle */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#08123B]/30">
                  <span className="px-1.5 text-[10px] font-bold text-[#7382A6] uppercase">
                    Mode:
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeMatchMode && onChangeMatchMode('any')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      matchMode === 'any'
                        ? 'bg-[#0052FF] text-white shadow-xs'
                        : 'text-[#4A5578] hover:text-[#08123B]'
                    }`}
                    title="Match people with ANY of the selected skills"
                  >
                    ANY (OR)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMatchMode && onChangeMatchMode('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      matchMode === 'all'
                        ? 'bg-[#FF007A] text-white shadow-xs'
                        : 'text-[#4A5578] hover:text-[#08123B]'
                    }`}
                    title="Match people with ALL selected skills"
                  >
                    ALL (AND)
                  </button>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-1.5">
                  {filteredSkills.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[10px] font-bold text-[#0052FF] hover:underline"
                    >
                      +Select {filteredSkills.length}
                    </button>
                  )}
                  {selectedSkills.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[10px] font-bold text-[#FF007A] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Body: Skills List categorized */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-[#08123B]/10">
              {Object.keys(categorizedSkills).length === 0 ? (
                <div className="py-8 text-center font-mono-code">
                  <p className="text-xs font-bold text-[#08123B]">No skills match "{searchQuery}"</p>
                  <p className="text-[11px] text-[#7382A6] mt-1">Try another search keyword.</p>
                </div>
              ) : (
                Object.entries(categorizedSkills).map(([cat, skills]) => (
                  <div key={cat} className="pt-3 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-code text-[11px] font-bold text-[#08123B] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
                        {cat}
                      </span>
                      <span className="font-mono-code text-[10px] text-[#7382A6]">
                        {skills.length} skills
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {skills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill.name);
                        return (
                          <button
                            key={skill.id || skill.name}
                            type="button"
                            onClick={() => toggleSkill(skill.name)}
                            className={`flex items-center justify-between p-2 rounded-lg border text-left font-mono-code text-xs transition-all ${
                              isSelected
                                ? 'border-[#08123B] bg-[#0052FF] text-white font-bold shadow-[2px_2px_0px_#08123B]'
                                : 'border-[#08123B]/20 bg-[#F4F6FB] text-[#08123B] hover:border-[#08123B] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 shrink-0 text-[#FFC700]" />
                              ) : (
                                <Square className="h-4 w-4 shrink-0 text-[#7382A6]" />
                              )}
                              <span className="truncate">{skill.name}</span>
                            </div>

                            {skill.personCount !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ml-1 ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-white text-[#7382A6] border border-[#08123B]/20'
                                }`}
                              >
                                {skill.personCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t-2 border-[#08123B] bg-[#F4F6FB] flex items-center justify-between font-mono-code text-xs">
              <span className="text-[#4A5578]">
                {selectedSkills.length} selected of {allSkills.length}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="brutal-btn bg-[#08123B] text-white px-3 py-1 text-xs font-display font-extrabold uppercase hover:bg-[#0052FF]"
              >
                APPLY FILTERS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Quick popular skills chip bar for 1-click toggling
 */
export function PopularSkillsPills({
  popularSkills = [],
  selectedSkills = [],
  onToggleSkill,
}) {
  if (!popularSkills || popularSkills.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 select-none no-scrollbar">
      <span className="flex items-center gap-1 font-mono-code text-[11px] font-bold text-[#FF007A] uppercase shrink-0 mr-1">
        <Flame className="h-3.5 w-3.5 fill-[#FF007A]" />
        <span>Top Skills:</span>
      </span>

      {popularSkills.map((skillName) => {
        const isSelected = selectedSkills.includes(skillName);
        return (
          <motion.button
            key={skillName}
            type="button"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleSkill(skillName)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono-code font-bold transition-all shrink-0 flex items-center gap-1 border-2 ${
              isSelected
                ? 'border-[#08123B] bg-[#0052FF] text-white shadow-[2px_2px_0px_#08123B]'
                : 'border-[#08123B]/30 bg-white text-[#08123B] hover:border-[#08123B] hover:bg-[#F4F6FB]'
            }`}
          >
            {isSelected && <Check className="h-3 w-3 text-[#FFC700]" />}
            <span>{skillName}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
