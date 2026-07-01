import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, ImagePlus, Check, Eye } from 'lucide-react';
import ColorPicker from 'react-best-gradient-color-picker';
import PreviewCanvas from './PreviewModal';
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
    maskMode: "circle-on-top"
  },
  text: {
    fontName: "Outfit",
    align: "left",
    baseline: "top",
    color: "linear-gradient(90deg, rgba(168,85,247,1) 0%, rgba(219,39,119,1) 50%, rgba(255,255,255,1) 100%)",
    left: 500,
    fields: [
      { id: "name", isBold: true, isItalic: false, size: 95, y: 1870 },
      { id: "position", isBold: false, isItalic: false, size: 60, y: 2000 },
      { id: "optional", isBold: false, isItalic: false, size: 48, y: 2090 }
    ]
  }
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 3000, height: 3000 });
  const [scale, setScale] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pickerContainerRef = useRef(null);
  const [pickerWidth, setPickerWidth] = useState(294);

  // Measure the sidebar panel width once on mount, subtract 60px for padding
  useEffect(() => {
    if (pickerContainerRef.current && pickerContainerRef.current.clientWidth > 0) {
      setPickerWidth(pickerContainerRef.current.clientWidth - 60);
    }
  }, []);

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
    // Generate the final exported config
    const exportConfig = { ...config };
    
    // Process Fonts & Styles
    exportConfig.text = { ...exportConfig.text };
    exportConfig.text.fields = exportConfig.text.fields.map(f => {
      const fieldExport = { ...f };
      let styles = [];
      if (f.isItalic) styles.push('italic');
      if (f.isBold) styles.push('bold');
      fieldExport.style = styles.join(' ');
      
      delete fieldExport.isBold;
      delete fieldExport.isItalic;
      return fieldExport;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportConfig, null, 2));
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
        <section ref={pickerContainerRef} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label className="input-label">Profile Mask Configuration</label>
                
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preview Placeholder Style</label>
                  <select 
                    className="text-input" 
                    value={config.pfp.maskMode}
                    onChange={e => setConfig(c => ({...c, pfp: {...c.pfp, maskMode: e.target.value}}))}
                  >
                    <option value="circle-on-top">Circle on Top (Default)</option>
                    <option value="detect-purple-tag">Auto-Detect Shape (Purple Placeholder)</option>
                    <option value="transparent">Use Transparent Image Hole</option>
                  </select>
                  <p style={{ fontSize: '0.7rem', color: 'var(--accent-purple-light)', marginTop: '4px', lineHeight: '1.4' }}>
                    *This setting only affects how the placeholder is visualized in Preview Mode. It does not alter the final generated output.
                  </p>
                  {config.pfp.maskMode === 'circle-on-top' && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      <strong>Recommended:</strong> Just pops the image into a simple circle directly on top of the template.
                    </p>
                  )}
                  {config.pfp.maskMode === 'detect-purple-tag' && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      Use this when your template has a solid purple placeholder shape for the profile picture.
                    </p>
                  )}
                  {config.pfp.maskMode === 'transparent' && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      Use this when your template already has a fully transparent hole cut out for the profile picture.
                    </p>
                  )}
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mask Radius</label>
                  <input 
                    type="number" 
                    className="text-input" 
                    value={config.pfp.radius}
                    onChange={e => setConfig(c => ({...c, pfp: {...c.pfp, radius: Number(e.target.value)}}))}
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Adjust this to change the size of the circular crop area for the user's photo.
                  </p>
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Border Color</label>
                  <input 
                    type="text" 
                    className="text-input" 
                    value={config.pfp.borderColor}
                    onChange={e => setConfig(c => ({...c, pfp: {...c.pfp, borderColor: e.target.value}}))}
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Optional: Hex color code for a border drawn around the mask (e.g. #ffffff).
                  </p>
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

              {/* Text Group Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label className="input-label">Text System Setup</label>
                
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Font Family</label>
                  <select 
                    className="text-input" 
                    value={config.text.fontName}
                    onChange={e => setConfig(c => ({...c, text: {...c.text, fontName: e.target.value}}))}
                  >
                    <option value="Outfit">Outfit</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                  </select>
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

                <div className="input-group" style={{ borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Global Text Color</label>
                  <div style={{ marginTop: '10px', width: '100%' }}>
                    <ColorPicker 
                      width={pickerWidth}
                      value={config.text.color} 
                      onChange={(val) => setConfig(c => ({...c, text: {...c.text, color: val}}))}
                      hidePresets={true}
                      style={{ body: { background: 'transparent' } }}
                    />
                  </div>
                </div>

                {config.text.fields.map((field, idx) => (
                  <div key={field.id} className="input-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--accent-purple-light)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {field.id === 'optional' ? 'Company / Institution' : field.id} Layer
                    </label>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Drag this layer on the canvas to reposition.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Font Size (px)</label>
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
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Styles</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className={`toggle-btn small ${field.isBold ? 'active' : ''}`}
                            onClick={() => {
                              const newFields = [...config.text.fields];
                              newFields[idx].isBold = !newFields[idx].isBold;
                              setConfig(c => ({...c, text: {...c.text, fields: newFields}}));
                            }}
                          >
                            B
                          </button>
                          <button 
                            className={`toggle-btn small ${field.isItalic ? 'active' : ''}`}
                            onClick={() => {
                              const newFields = [...config.text.fields];
                              newFields[idx].isItalic = !newFields[idx].isItalic;
                              setConfig(c => ({...c, text: {...c.text, fields: newFields}}));
                            }}
                          >
                            I
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {imageSrc && (
              <>
                <button 

                  className="btn-primary" 
                  onClick={downloadJson}
                  style={{ width: '100%' }}
                >
                  <Download size={18} />
                  Export flyerConfig.json
                </button>
              </>
            )}
          </div>
        </section>

        {/* Right Side: Visual Workspace */}
        <section className="preview-container">
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Interactive Workspace</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Drag elements directly on canvas
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: showPreview ? 'var(--accent-purple-light)' : 'var(--text-secondary)' }}>Preview Mode</label>
                <button 
                  className={`toggle-switch ${showPreview ? 'active' : ''}`} 
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            </div>
            
            <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: imageSize.width && imageSize.height ? `${imageSize.width} / ${imageSize.height}` : '1', borderRadius: '12px', overflow: 'hidden', background: '#090610', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              
              {imageSrc ? (
                showPreview ? (
                  <PreviewCanvas config={config} templateImageSrc={imageSrc} />
                ) : (
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
                        color: config.text.color.includes('gradient') ? 'transparent' : config.text.color,
                        backgroundImage: config.text.color.includes('gradient') ? config.text.color : 'none',
                        WebkitBackgroundClip: config.text.color.includes('gradient') ? 'text' : 'border-box',
                        backgroundClip: config.text.color.includes('gradient') ? 'text' : 'border-box',
                        fontSize: field.size,
                        fontWeight: field.isBold ? 'bold' : 'normal',
                        fontStyle: field.isItalic ? 'italic' : 'normal',
                        textAlign: config.text.align,
                        fontFamily: config.text.fontName || 'sans-serif'
                      }}
                    >
                      {field.id === 'optional' ? 'COMPANY' : field.id.toUpperCase()}
                    </div>
                  ))}
                </div>
                )
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
