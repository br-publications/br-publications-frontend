// components/SubmissionFilters.tsx

import { useState } from 'react';
import type { SubmissionStage, FilterOptions } from '../../types/submissionTypes';

interface SubmissionFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function SubmissionFilters({ filters, onFilterChange }: SubmissionFiltersProps) {
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);

  const handleOverdueToggle = () => {
    onFilterChange({ ...filters, overdue: !filters.overdue });
  };

  const handleIncompleteToggle = () => {
    onFilterChange({ ...filters, incomplete: !filters.incomplete });
  };

  const handleStageToggle = (stage: SubmissionStage) => {
    const newStages = filters.stages.includes(stage)
      ? filters.stages.filter(s => s !== stage)
      : [...filters.stages, stage];
    onFilterChange({ ...filters, stages: newStages });
  };

  const handleSectionToggle = (section: string) => {
    const newSections = filters.sections.includes(section)
      ? filters.sections.filter(s => s !== section)
      : [...filters.sections, section];
    onFilterChange({ ...filters, sections: newSections });
  };

  return (
    <div className="w-full lg:w-64 bg-white border-r border-gray-200 p-4 space-y-6">
      {/* Filters Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <h3 className="font-semibold text-gray-800">Filters</h3>
      </div>

      {/* Quick Filters */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
          <input
            type="checkbox"
            checked={filters.overdue}
            onChange={handleOverdueToggle}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 flex items-center gap-2">
            Overdue
            {filters.overdue && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Active</span>
            )}
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
          <input
            type="checkbox"
            checked={filters.incomplete}
            onChange={handleIncompleteToggle}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 flex items-center gap-2">
            Incomplete
            {filters.incomplete && (
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">Active</span>
            )}
          </span>
        </label>
      </div>

      {/* Stages */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3 text-sm">Stages</h4>
        <div className="space-y-2">
          {(['Submission', 'Review', 'Copyediting', 'Production'] as SubmissionStage[]).map((stage) => (
            <label
              key={stage}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.stages.includes(stage)}
                onChange={() => handleStageToggle(stage)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{stage}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <button
          onClick={() => setIsActivityExpanded(!isActivityExpanded)}
          className="flex items-center justify-between w-full font-medium text-gray-800 mb-2 text-sm hover:text-blue-600 transition-colors"
        >
          <span>Activity</span>
          <svg
            className={`w-4 h-4 transition-transform ${isActivityExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isActivityExpanded && (
          <div className="space-y-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Days since last activity</span>
            </label>
          </div>
        )}
      </div>

      {/* Sections */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3 text-sm">Sections</h4>
        <div className="space-y-2">
          {['Articles', 'Book Chapters', 'Case Studies'].map((section) => (
            <label
              key={section}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.sections.includes(section)}
                onChange={() => handleSectionToggle(section)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{section}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFilterChange({
          overdue: false,
          incomplete: false,
          stages: [],
          activity: [],
          sections: []
        })}
        className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
      >
        Clear All Filters
      </button>
    </div>
  );
}