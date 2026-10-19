'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import './TrueFocus.css';

const TrueFocusContext = createContext(null);

export const TrueFocusTarget = ({
  index,
  children,
  className = '',
  style = {},
  borderColor,
  glowColor
}) => {
  const ctx = useContext(TrueFocusContext);

  if (!ctx) {
    return <span className={className} style={style}>{children}</span>;
  }

  const {
    registerWord,
    currentIndex,
    manualMode,
    blurAmount,
    handleMouseEnter,
    handleMouseLeave,
    animationDuration
  } = ctx;

  const isActive = index === currentIndex;

  return (
    <span
      ref={el => registerWord(index, el, { borderColor, glowColor })}
      className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''} ${className}`}
      style={{
        display: 'inline-block',
        filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
        transition: `filter ${animationDuration}s ease`,
        ...style
      }}
      onMouseEnter={() => handleMouseEnter(index)}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
};

const TrueFocus = ({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = 'green',
  glowColor = 'rgba(0, 255, 0, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = '',
  style = {},
  children
}) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState(null);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  const targetMetaRef = useRef([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const isCompoundMode = Boolean(children);
  const activeWordCount = isCompoundMode ? targetMetaRef.current.length || 2 : words.length;

  const registerWord = useCallback((index, el, meta = {}) => {
    wordRefs.current[index] = el;
    targetMetaRef.current[index] = meta;
  }, []);

  useEffect(() => {
    if (!manualMode && activeWordCount > 0) {
      const interval = setInterval(
        () => {
          setCurrentIndex(prev => (prev + 1) % activeWordCount);
        },
        (animationDuration + pauseBetweenAnimations) * 1000
      );

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, activeWordCount]);

  const updateRect = useCallback(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex].getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex]);

  useEffect(() => {
    updateRect();
    const rafId = requestAnimationFrame(updateRect);
    window.addEventListener('resize', updateRect);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateRect);
    };
  }, [updateRect, currentIndex, activeWordCount]);

  const handleMouseEnter = index => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex);
    }
  };

  // Resolve dynamic colors if arrays or target metadata are provided
  const activeMeta = targetMetaRef.current[currentIndex] || {};
  const currentBorderColor =
    activeMeta.borderColor ||
    (Array.isArray(borderColor) ? borderColor[currentIndex % borderColor.length] : borderColor);
  const currentGlowColor =
    activeMeta.glowColor ||
    (Array.isArray(glowColor) ? glowColor[currentIndex % glowColor.length] : glowColor);

  return (
    <TrueFocusContext.Provider
      value={{
        registerWord,
        currentIndex,
        manualMode,
        blurAmount,
        handleMouseEnter,
        handleMouseLeave,
        animationDuration
      }}
    >
      <div
        className={`focus-container ${isCompoundMode ? 'custom-layout' : ''} ${className}`}
        ref={containerRef}
        style={style}
      >
        {isCompoundMode ? (
          children
        ) : (
          words.map((word, index) => {
            const isActive = index === currentIndex;
            return (
              <span
                key={index}
                ref={el => {
                  wordRefs.current[index] = el;
                }}
                className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''}`}
                style={{
                  filter: manualMode
                    ? isActive
                      ? 'blur(0px)'
                      : `blur(${blurAmount}px)`
                    : isActive
                      ? 'blur(0px)'
                      : `blur(${blurAmount}px)`,
                  '--border-color': currentBorderColor,
                  '--glow-color': currentGlowColor,
                  transition: `filter ${animationDuration}s ease`
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                {word}
              </span>
            );
          })
        )}

        <motion.div
          className="focus-frame"
          animate={{
            x: focusRect.x,
            y: focusRect.y,
            width: focusRect.width,
            height: focusRect.height,
            opacity: currentIndex >= 0 && focusRect.width > 0 ? 1 : 0
          }}
          transition={{
            duration: animationDuration,
            ease: [0.25, 1, 0.5, 1]
          }}
          style={{
            '--border-color': currentBorderColor,
            '--glow-color': currentGlowColor
          }}
        >
          <span className="corner top-left"></span>
          <span className="corner top-right"></span>
          <span className="corner bottom-left"></span>
          <span className="corner bottom-right"></span>
        </motion.div>
      </div>
    </TrueFocusContext.Provider>
  );
};

TrueFocus.Target = TrueFocusTarget;

export default TrueFocus;
