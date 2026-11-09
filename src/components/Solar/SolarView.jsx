import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  ExternalLink, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';

const SOLAX_CLOUD_URL = 'https://global.solaxcloud.com/green/#/overview?stationId=1790651479335497733&siteId=1790651479335497733&businessType=1&onlyView=1&isOnlyQuerySiteId=1&newTab=0';

export default function SolarView({ role = 'admin' }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const viewRef = useRef(null);

  // Auto scroll to top on mount so header and controls are instantly in full view
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    const contentArea = document.querySelector('.app-content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(k => k + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  return (
    <div 
      ref={viewRef}
      className={`view-container ${isFullscreen ? 'solar-fullscreen-active' : ''}`} 
      style={{
        gap: '0.65rem',
        ...(isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          backgroundColor: '#0f172a',
          padding: '1rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        } : {})
      }}
    >
      {/* Header Bar */}
      <div className="view-header" style={{ marginBottom: '0.25rem' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}>
              <Sun size={20} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Solax Cloud Solar System
                </h2>
                <span className="badge badge-success flex items-center gap-1 font-semibold text-xs">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  Live Inverter Cloud
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            Live photovoltaic energy generation, station yield, power curves & inverter telemetry from Solax Cloud.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="view-header-actions flex items-center gap-2">
          <button 
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            onClick={handleRefresh}
            title="Reload Solar Dashboard Frame"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Reload</span>
          </button>

          <button 
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          <a
            href={SOLAX_CLOUD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            title="Open Solax Cloud Portal in a new browser tab"
          >
            <ExternalLink size={13} />
            <span>Open in Solax Cloud</span>
          </a>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.5rem 0.85rem',
        marginBottom: '0.35rem',
        borderRadius: 'var(--radius-md, 8px)',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.22)',
        fontSize: '0.78rem'
      }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <Zap size={14} style={{ color: '#f59e0b' }} />
            Station ID: <strong className="font-mono text-amber" style={{ color: '#f59e0b' }}>1790651479335497733</strong>
          </span>
          <span className="text-muted">•</span>
          <span className="flex items-center gap-1 text-muted">
            <Activity size={13} style={{ color: '#10b981' }} />
            Telemetry: <span className="text-emerald font-semibold" style={{ color: '#10b981' }}>Connected</span>
          </span>
          <span className="text-muted">•</span>
          <span className="flex items-center gap-1 text-muted">
            <ShieldCheck size={13} style={{ color: 'var(--brand-primary, #38bdf8)' }} />
            Security: <span>Read-Only View</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.73rem' }}>
          <Clock size={12} />
          <span>Real-time station metrics</span>
        </div>
      </div>

      {/* Embedded Solax Cloud iFrame Card - Full Height Frame */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 100px)' : 'calc(100vh - 200px)',
          minHeight: '760px',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)'
        }}
      >
        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.85rem',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            zIndex: 10,
            color: '#f59e0b'
          }}>
            <Sun size={38} className="animate-spin" style={{ color: '#f59e0b' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>
                Connecting to Solax Cloud...
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Loading live plant overview & inverter metrics
              </span>
            </div>
          </div>
        )}

        {/* Live iFrame - Absolutely positioned to guarantee 100% height and width expansion */}
        <iframe
          key={iframeKey}
          src={SOLAX_CLOUD_URL}
          title="Solax Cloud Solar System Overview"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            backgroundColor: '#ffffff'
          }}
          allow="fullscreen; clipboard-read; clipboard-write"
          loading="eager"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Helpful Hint Callout Footer */}
      {!isFullscreen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.4rem',
          padding: '0.4rem 0.85rem',
          fontSize: '0.73rem',
          color: 'var(--text-muted, #94a3b8)',
          borderRadius: 'var(--radius-sm, 6px)',
          backgroundColor: 'var(--bg-surface-elevated, rgba(255, 255, 255, 0.02))'
        }}>
          <span className="flex items-center gap-1.5">
            <Info size={13} style={{ color: 'var(--brand-primary, #38bdf8)' }} />
            Embedded Solax Cloud Overview. If your browser blocks cross-origin cookies or frames, click <strong>"Open in Solax Cloud"</strong> above to view in a dedicated window.
          </span>
          <span className="font-mono text-xs">stationId=1790651479335497733</span>
        </div>
      )}
    </div>
  );
}
