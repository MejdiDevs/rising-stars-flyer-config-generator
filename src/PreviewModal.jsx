import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function PreviewCanvas({ config, templateImageSrc }) {
  const canvasRef = useRef(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const templateImgRef = useRef(null);

  const canvasSize = 3000;
  const { center: pfpCenter, radius: pfpRadius } = config.pfp;

  // Generic data for preview
  const genericData = {
    name: "JOHN DOE",
    position: "SOFTWARE ENGINEER",
    optional: "ACME CORP"
  };



  // Wait for fonts to be ready
  useEffect(() => {
    document.fonts.ready.then(() => setFontLoaded(true));
  }, []);

  // 1. Load user image (person.jpg)
  useEffect(() => {
    const img = new Image();
    img.src = '/person.jpg'; // Load from public folder
    img.onload = () => setUserImage(img);
    img.onerror = (err) => console.error("Error loading preview person.jpg", err);
  }, []);

  // 2. Load template image and process transparency
  useEffect(() => {
    if (!templateImageSrc) {
      setTemplateLoaded(true); // Nothing to load, allow drawing fallback
      return;
    }

    const img = new Image();
    img.src = templateImageSrc;
    img.onload = () => {
      if (config.pfp.maskMode === 'transparent') {
        templateImgRef.current = img;
        setTemplateLoaded(true);
        return;
      }

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvasSize;
      offscreenCanvas.height = canvasSize;
      const ctx = offscreenCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
        const data = imgData.data;

        const startX = Math.floor(pfpCenter.x - pfpRadius - 10);
        const endX = Math.ceil(pfpCenter.x + pfpRadius + 10);
        const startY = Math.floor(pfpCenter.y - pfpRadius - 10);
        const endY = Math.ceil(pfpCenter.y + pfpRadius + 10);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) continue;

            const dx = x - pfpCenter.x;
            const dy = y - pfpCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < pfpRadius) {
              const idx = (y * canvasSize + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              if (config.pfp.maskMode === 'detect-purple-tag') {
                const isPurpleTag = (b > g * 2 && b > 50 && r < 100);
                if (!isPurpleTag) {
                  data[idx + 3] = 0; // Make transparent
                }
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        templateImgRef.current = offscreenCanvas;
      } catch (err) {
        console.error("Error processing transparency in preview:", err);
        templateImgRef.current = img;
      }
      setTemplateLoaded(true);
    };
  }, [templateImageSrc, config.pfp.maskMode, pfpCenter, pfpRadius]);

  // 3. Draw on canvas
  useEffect(() => {
    if (!templateLoaded || !userImage || !fontLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (config.pfp.maskMode === 'circle-on-top') {
      // 1. Draw Template FIRST
      if (templateImgRef.current) {
        ctx.drawImage(templateImgRef.current, 0, 0, canvasSize, canvasSize);
      } else {
        ctx.fillStyle = '#0f0c1b';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
      }

      // 2. Draw User Photo ON TOP
      ctx.save();
      ctx.beginPath();
      ctx.arc(pfpCenter.x, pfpCenter.y, pfpRadius, 0, Math.PI * 2);
      ctx.clip();

      const frameDiameter = pfpRadius * 2;
      const baseScale = frameDiameter / Math.min(userImage.width, userImage.height);
      const drawWidth = userImage.width * baseScale;
      const drawHeight = userImage.height * baseScale;
      const drawX = pfpCenter.x - drawWidth / 2;
      const drawY = pfpCenter.y - drawHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Draw border if requested
      if (config.pfp.borderWidth > 0) {
        ctx.beginPath();
        ctx.arc(pfpCenter.x, pfpCenter.y, pfpRadius, 0, Math.PI * 2);
        ctx.strokeStyle = config.pfp.borderColor || '#ffffff';
        ctx.lineWidth = config.pfp.borderWidth;
        ctx.stroke();
      }
    } else {
      // Draw user photo under template (detect-purple-tag / transparent)
      ctx.save();
      ctx.beginPath();
      ctx.arc(pfpCenter.x, pfpCenter.y, pfpRadius + 3, 0, Math.PI * 2);
      ctx.clip();

      const frameDiameter = pfpRadius * 2;
      const baseScale = frameDiameter / Math.min(userImage.width, userImage.height);
      const drawWidth = userImage.width * baseScale;
      const drawHeight = userImage.height * baseScale;

      // Center image
      const drawX = pfpCenter.x - drawWidth / 2;
      const drawY = pfpCenter.y - drawHeight / 2;

      ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Draw template on top
      if (templateImgRef.current) {
        ctx.drawImage(templateImgRef.current, 0, 0, canvasSize, canvasSize);
      } else {
        ctx.fillStyle = '#0f0c1b';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
      }
    }

    // Draw text
    const fontName = config.text.fontName || 'Outfit';
    ctx.textAlign = config.text.align || 'left';
    ctx.textBaseline = config.text.baseline || 'top';
    const baseTextFillStyle = config.text.color || '#ffffff';
    const textLeft = config.text.left;

    config.text.fields.forEach(field => {
      let fieldValue = genericData[field.id] || '';

      if (fieldValue.trim()) {
        let styles = [];
        if (field.isItalic) styles.push('italic');
        if (field.isBold) styles.push('bold');
        const styleStr = styles.length > 0 ? styles.join(' ') + ' ' : '';
        
        ctx.font = `${styleStr}${field.size}px "${fontName}"`;
        
        const metrics = ctx.measureText(fieldValue.trim());
        const textWidth = metrics.width;
        const textHeight = field.size; // approximate

        let currentFillStyle = baseTextFillStyle;

        if (typeof currentFillStyle === 'string' && currentFillStyle.includes('linear-gradient')) {
          try {
            const angleMatch = currentFillStyle.match(/(-?\d+)deg/);
            const angleDeg = angleMatch ? parseInt(angleMatch[1]) : 90;
            const angleRad = (angleDeg - 90) * Math.PI / 180;
            
            // Align with text bounds
            // textLeft depends on textAlign. If left, cx is textLeft + textWidth / 2.
            let cx = textLeft + textWidth / 2;
            if (ctx.textAlign === 'center') cx = textLeft;
            else if (ctx.textAlign === 'right') cx = textLeft - textWidth / 2;
            
            const cy = field.y + textHeight / 2;
            
            const length = Math.abs(textWidth * Math.cos(angleRad)) + Math.abs(textHeight * Math.sin(angleRad));
            const dx = Math.cos(angleRad) * length / 2;
            const dy = Math.sin(angleRad) * length / 2;
            
            const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
            
            const colorStopsMatch = currentFillStyle.match(/(rgba?\([^)]+\)|#[a-fA-F0-9]+)\s+(\d+)%/g);
            if (colorStopsMatch) {
              colorStopsMatch.forEach(stop => {
                const parts = stop.match(/(rgba?\([^)]+\)|#[a-fA-F0-9]+)\s+(\d+)%/);
                if (parts) {
                  gradient.addColorStop(parseInt(parts[2]) / 100, parts[1]);
                }
              });
              currentFillStyle = gradient;
            }
          } catch (err) {
            console.error("Failed to parse linear gradient:", err);
          }
        } else if (typeof currentFillStyle === 'string' && currentFillStyle.includes('radial-gradient')) {
          try {
            let cx = textLeft + textWidth / 2;
            if (ctx.textAlign === 'center') cx = textLeft;
            else if (ctx.textAlign === 'right') cx = textLeft - textWidth / 2;
            const cy = field.y + textHeight / 2;
            const r = Math.max(textWidth, textHeight) / 2;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            
            const colorStopsMatch = currentFillStyle.match(/(rgba?\([^)]+\)|#[a-fA-F0-9]+)\s+(\d+)%/g);
            if (colorStopsMatch) {
              colorStopsMatch.forEach(stop => {
                const parts = stop.match(/(rgba?\([^)]+\)|#[a-fA-F0-9]+)\s+(\d+)%/);
                if (parts) {
                  gradient.addColorStop(parseInt(parts[2]) / 100, parts[1]);
                }
              });
              currentFillStyle = gradient;
            }
          } catch (err) {
            console.error("Failed to parse radial gradient:", err);
          }
        }

        ctx.fillStyle = currentFillStyle;
        ctx.fillText(fieldValue.trim(), textLeft, field.y);
      }
    });

  }, [templateLoaded, userImage, fontLoaded, config]);

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {(!templateLoaded || !userImage) && (
        <div className="preview-loading" style={{ position: 'absolute' }}>
          <Loader2 className="spinning-icon" size={32} color="var(--accent-purple-light)" />
          <p>Generating preview...</p>
        </div>
      )}
      
      <canvas 
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="preview-canvas"
        style={{ opacity: (templateLoaded && userImage) ? 1 : 0, width: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
      />
    </div>
  );
}
