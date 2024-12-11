import React, { useRef, useState, useEffect } from 'react';

export default function TabSelector({ 
  options,
  value,
  onChange,
  style,
  initialValue // New prop for initial position
}) {
  const [underlineStyle, setUnderlineStyle] = useState({});
  const [isInitialRender, setIsInitialRender] = useState(true);
  const tabRefs = useRef({});

  const getTextColor = (option) => {
    return value === option ? '#626364' : '#949596';
  };

  const updateUnderline = (option, shouldAnimate = true) => {
    const element = tabRefs.current[option];
    if (element) {
      setUnderlineStyle({
        width: `${element.offsetWidth}px`,
        transform: `translateX(${element.offsetLeft}px)`,
        transition: shouldAnimate ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none"
      });
    }
  };

  // Initial positioning without animation
  useEffect(() => {
    if (isInitialRender && initialValue) {
      updateUnderline(initialValue, false);
      setIsInitialRender(false);
    }
  }, [tabRefs.current[initialValue]]);

  // Handle subsequent updates with animation
  useEffect(() => {
    if (!isInitialRender) {
      updateUnderline(value, true);
    }
  }, [value]);

  return (
    <div style={{
      width: "fit-content",
      overflow: "hidden",
      alignItems: "center",
      padding: "0 12px",
      borderRadius: "64px",
      display: "flex",
      flexDirection: "row",
      gap: 16,
      border: "1px solid #EBEBEB",
      position: "relative",
      fontSize: 16,
      ...style
    }}>
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 2,
        backgroundColor: "#626364",
        borderRadius: 16,
        ...underlineStyle
      }} />

      {options.map((option) => (
        <div
          key={option}
          ref={el => tabRefs.current[option] = el}
          onClick={() => onChange(option)}
          style={{
            height: 38,
            cursor: 'pointer',
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            padding: "0 4px",
          }}
        >
          <div style={{width: "100%", display: "flex", height: 2}} />
          <p style={{
            margin: 0,
            color: getTextColor(option),
            transition: 'color 0.2s ease',
            userSelect: "none",
          }}>
            {option}
          </p>
          <div style={{width: "100%", display: "flex", height: 2}} />
        </div>
      ))}
    </div>
  );
} 