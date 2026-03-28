'use client';

import React from 'react';

interface ImmediateInstructionBoxProps {
  status: string;
  instruction: string;
  onSpeak: (text: string) => void;
}

/**
 * Box showing the most critical action to take immediately.
 * Includes Text-to-Speech support for accessibility.
 */
export const ImmediateInstructionBox: React.FC<ImmediateInstructionBoxProps> = ({ 
  status, 
  instruction, 
  onSpeak 
}) => {
  const bgClass = status === 'Critical' ? 'bg-critical' : status === 'Urgent' ? 'bg-urgent' : 'bg-info';

  return (
    <div className={`immediate-instruction-box ${bgClass}`}>
      <div className="instruction-content">
        <div className="instruction-label">Immediate Instruction</div>
        <div className="instruction-text">
          {instruction}
        </div>
      </div>
      <button
        type="button"
        className="speak-btn"
        onClick={() => onSpeak(instruction)}
        aria-label="Read immediate instruction aloud"
      >
        🔊 Speak
      </button>
    </div>
  );
};
