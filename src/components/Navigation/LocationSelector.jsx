import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Building2, ChevronDown, Check, Sparkles } from 'lucide-react';
import { LOCATION_OPTIONS } from '../../services/locationService';

export default function LocationSelector({ selectedLocation = 'All', onSelectLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeOption = LOCATION_OPTIONS.find(opt => opt.id === selectedLocation) || LOCATION_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (id) => {
    onSelectLocation(id);
    setIsOpen(false);
  };

  return (
    <div className="location-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`location-selector-trigger ${selectedLocation !== 'All' ? 'is-filtered' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label="Filter by facility location"
        title={`Current facility filter: ${activeOption.label}`}
      >
        <div className="location-trigger-icon-wrap" style={{ color: activeOption.color }}>
          {selectedLocation === 'All' ? (
            <Building2 size={16} />
          ) : (
            <MapPin size={16} />
          )}
          <span 
            className="location-active-pulse"
            style={{ backgroundColor: activeOption.color }}
          />
        </div>

        <div className="location-trigger-text">
          <span className="location-trigger-caption">Facility</span>
          <span className="location-trigger-name">{activeOption.shortLabel}</span>
        </div>

        <ChevronDown 
          size={14} 
          className={`location-chevron ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="location-dropdown-panel" role="menu">
          <div className="location-dropdown-header">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Select Operational Facility
            </span>
          </div>

          <div className="location-options-list">
            {LOCATION_OPTIONS.map((opt) => {
              const isSelected = selectedLocation === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`location-option-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                  role="menuitem"
                >
                  <div className="location-option-left">
                    <div 
                      className="location-option-icon" 
                      style={{ 
                        color: opt.color, 
                        background: `${opt.color}15`,
                        borderColor: `${opt.color}35`
                      }}
                    >
                      {opt.id === 'All' ? <Building2 size={16} /> : <MapPin size={16} />}
                    </div>
                    <div className="location-option-details">
                      <div className="flex items-center gap-1.5">
                        <span className="location-option-title">{opt.label}</span>
                        {opt.id === 'Palawiya' && (
                          <span className="location-new-badge">Branch</span>
                        )}
                      </div>
                      <span className="location-option-sub">{opt.description}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="location-check-icon" style={{ color: opt.color }}>
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedLocation !== 'All' && (
            <div className="location-dropdown-footer">
              <button
                type="button"
                className="location-reset-btn"
                onClick={() => handleSelect('All')}
              >
                Reset to All Facilities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
