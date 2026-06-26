import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, ImagePlus, Check } from 'lucide-react';
import './index.css';

const DEFAULT_CONFIG = {
  template: {
    src: "./temp_v2.png",
    size: 3000
  },
  pfp: {
    center: { x: 1500, y: 1000 },
    radius: 450,
    borderWidth: 0,
    borderColor: "#ffffff",
    maskMode: "detect-purple-tag"
  },
  text: {
    fontName: "OutfitFont",
    align: "left",
    baseline: "top",
    color: "#ffffff",
    left: 500,
    fields: [
      { id: "name", style: "bold", size: 95, y: 1870 },
      { id: "position", style: "", size: 60, y: 2000 },
      { id: "optional", style: "", size: 48, y: 2090 }
    ]
  }
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 3000, height: 3000 });
  const [scale, setScale] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Image and update dimensions
  const handleImageUpload = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageSrc(url);
        setConfig(c => ({
          ...c,
          template: { ...c.template, src: `./${file.name}`, size: Math.max(img.naturalWidth, img.naturalHeight) }
        }));
      };
      img.src = url;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Recalculate scale on window resize or image change
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !imageSize.width) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const s = Math.min(
        width / imageSize.width, 
        height / imageSize.height
      );
      setScale(s > 0 ? s : 0.1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [imageSize, imageSrc]);

  // Drag Handlers
  const handlePfpDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCx = config.pfp.center.x;
    const startCy = config.pfp.center.y;

    const onMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      setConfig(c => ({
        ...c,
        pfp: {
          ...c.pfp,
          center: { x: Math.round(startCx + dx), y: Math.round(startCy + dy) }
        }
      }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleTextDrag = (e, fieldIndex) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = config.text.left;
    const startYPos = config.text.fields[fieldIndex].y;

    const onMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      setConfig(c => {
        const newFields = [...c.text.fields];
        newFields[fieldIndex] = { ...newFields[fieldIndex], y: Math.round(startYPos + dy) };
        return {
          ...c,
          text: {
            ...c.text,
            left: Math.round(startLeft + dx),
            fields: newFields
          }
        };
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "flyerConfig.json");
    dlAnchorElem.click();
  };

  return (
    <div className="app-container">
      {/* Header matching root app */}
      <header className="app-header">
        <div className="logo-section">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em' }}>CONFIG GENERATOR</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Companion Configuration Tool</p>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="main-grid">
        
        {/* Left Side: Control Panel (Form Inputs) */}
        <section className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px', color: '#ffffff' }}>Design Structure</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Upload your new template image to start configuring visually.</p>
          </div>

          {/* Template Uploader */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="input-label">Flyer Template Image</label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />

            {!imageSrc ? (
              <div 
                className={`dropzone ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="dropzone-icon" />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Upload template base</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Drag & drop or click to browse</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple-light)', padding: '6px', borderRadius: '8px' }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Template Active</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visual mode enabled</p>
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {imageSrc && (
            <>
              <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

              {/* Profile Picture Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label className="input-label">Profile Mask Configuration</label>
                
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mask Radius</label>
                  <input 
                    type="number" 
                    className="text-input" 
                    value={config.pfp.radius}
                    onChange={e => setConfig(c => ({...c, pfp: {...c.pfp, radius: Number(e.target.value)}}))}
                  />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Border Color</label>
                  <input 
                    type="text" 
                    className="text-input" 
                    value={config.pfp.borderColor}
                    onChange={e => setConfig(c => ({...c, pfp: {...c.pfp, borderColor: e.target.value}}))}
                  />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mask Processing Mode</label>
                  <select 
                    className="text-input" 
                    value={config.pfp.maskMode}
                    onChange={e => setConfig(c => ({...c, pfp: {...c.pfp, maskMode: e.target.value}}))}
                  >
                    <option value="detect-purple-tag">Detect Purple Tag</option>
                    <option value="transparent">Fully Transparent</option>
                  </select>
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

              {/* Text Group Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label className="input-label">Text System Setup</label>
                
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Global Text Color</label>
                  <input 
                    type="text" 
                    className="text-input" 
                    value={config.text.color}
                    onChange={e => setConfig(c => ({...c, text: {...c.text, color: e.target.value}}))}
                  />
                </div>
                
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Alignment</label>
                  <select 
                    className="text-input" 
                    value={config.text.align}
                    onChange={e => setConfig(c => ({...c, text: {...c.text, align: e.target.value}}))}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {config.text.fields.map((field, idx) => (
                  <div key={field.id} className="input-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--accent-purple-light)', textTransform: 'uppercase', fontWeight: 600 }}>{field.id} Layer</label>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Size (px)</label>
                        <input 
                          type="number" 
                          className="text-input" 
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          value={field.size}
                          onChange={e => {
                            const newFields = [...config.text.fields];
                            newFields[idx].size = Number(e.target.value);
                            setConfig(c => ({...c, text: {...c.text, fields: newFields}}));
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Style</label>
                        <select 
                          className="text-input" 
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          value={field.style}
                          onChange={e => {
                            const newFields = [...config.text.fields];
                            newFields[idx].style = e.target.value;
                            setConfig(c => ({...c, text: {...c.text, fields: newFields}}));
                          }}
                        >
                          <option value="">Normal</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

          {/* Action Buttons */}
          <button 
            className="btn-primary" 
            onClick={downloadJson}
            disabled={!imageSrc}
            style={{ width: '100%' }}
          >
            <Download size={18} />
            Export flyerConfig.json
          </button>
        </section>

        {/* Right Side: Visual Workspace */}
        <section className="preview-container">
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Interactive Visual Setup</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Drag elements directly on canvas
              </span>
            </div>
            
            <div ref={containerRef} style={{ position: 'relative', width: '100%', aspectRatio: imageSize.width && imageSize.height ? `${imageSize.width} / ${imageSize.height}` : '1', borderRadius: '12px', overflow: 'hidden', background: '#090610', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              
              {imageSrc ? (
                <div 
                  style={{
                    position: 'absolute',
                    width: imageSize.width,
                    height: imageSize.height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    top: `calc(50% - ${(imageSize.height * scale) / 2}px)`,
                    left: `calc(50% - ${(imageSize.width * scale) / 2}px)`
                  }}
                >
                  <img src={imageSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
                  
                  <div 
                    className="draggable-pfp"
                    onPointerDown={handlePfpDrag}
                    style={{
                      left: config.pfp.center.x,
                      top: config.pfp.center.y,
                      width: config.pfp.radius * 2,
                      height: config.pfp.radius * 2,
                      borderColor: config.pfp.borderColor,
                      borderWidth: config.pfp.borderWidth || 0,
                      borderStyle: config.pfp.borderWidth ? 'solid' : 'dashed'
                    }}
                  />

                  {config.text.fields.map((field, idx) => (
                    <div 
                      key={field.id}
                      className="draggable-text"
                      onPointerDown={(e) => handleTextDrag(e, idx)}
                      style={{
                        left: config.text.left,
                        top: field.y,
                        color: config.text.color,
                        fontSize: field.size,
                        fontWeight: field.style === 'bold' ? 'bold' : 'normal',
                        textAlign: config.text.align,
                        fontFamily: config.text.fontName === 'OutfitFont' ? 'Outfit' : 'sans-serif'
                      }}
                    >
                      {field.id.toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', gap: '15px' }}>
                  <ImagePlus size={32} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Canvas empty</p>
                </div>
              )}

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
