'use client';

import React from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { Agent } from '@/lib/ai/agent';
import { useEffect, useState, useCallback } from 'react';
import Konva from 'konva';

// Constants for battlefield visualization
const CELL_SIZE = 40; // Size of each grid cell in pixels
const VISIBLE_COLS = 30; // Number of visible columns
const VISIBLE_ROWS = 20; // Number of visible rows
const GRID_ALPHA = 0.3; // Grid line opacity

// Unit type to color mapping
const UNIT_COLORS = {
  scout: '#00FFD1', // Accent Cyan
  defender: '#96FF00', // AI Green
  attacker: '#FF4F58', // Alert Red
  engineer: '#FFD700', // Gold
  drone: '#00FFD1', // Cyan
  tank: '#FF4F58', // Red
  special_ops: '#9370DB', // Purple
  medic: '#20B2AA', // Light Sea Green
  default: '#202932', // Borders & Lines
};

interface BattlefieldProps {
  agents: Agent[];
  width: number;
  height: number;
}

export function Battlefield({ agents, width, height }: BattlefieldProps) {
  // State for stage position and scale
  const [stagePos, setStagePos] = useState({ x: width / 2, y: height / 2 });
  const [stageScale, setStageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Handle stage dragging
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);
  
  // Handle mouse wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Calculate visible grid area based on stage position and scale
  const getVisibleGridLines = useCallback(() => {
    const startX = Math.floor(-stagePos.x / (CELL_SIZE * stageScale));
    const startY = Math.floor(-stagePos.y / (CELL_SIZE * stageScale));
    const endX = startX + Math.ceil(width / (CELL_SIZE * stageScale)) + 1;
    const endY = startY + Math.ceil(height / (CELL_SIZE * stageScale)) + 1;

    const lines = [];

    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      lines.push(
        <Rect
          key={`v-${x}`}
          x={x * CELL_SIZE}
          y={startY * CELL_SIZE}
          width={1}
          height={(endY - startY) * CELL_SIZE}
          fill="#202932"
          opacity={GRID_ALPHA}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      lines.push(
        <Rect
          key={`h-${y}`}
          x={startX * CELL_SIZE}
          y={y * CELL_SIZE}
          width={(endX - startX) * CELL_SIZE}
          height={1}
          fill="#202932"
          opacity={GRID_ALPHA}
        />
      );
    }

    return lines;
  }, [stagePos, stageScale, width, height]);

  return (
    <Stage
      width={width}
      height={height}
      onWheel={handleWheel}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      x={stagePos.x}
      y={stagePos.y}
      scale={{ x: stageScale, y: stageScale }}
    >
      <Layer>
        {/* Draw infinite grid */}
        {getVisibleGridLines()}

        {/* Draw coordinate labels */}
        {agents.map((agent) => {
          const unitColor = UNIT_COLORS[agent.type as keyof typeof UNIT_COLORS] || UNIT_COLORS.default;
          const x = agent.position.x * CELL_SIZE;
          const y = agent.position.y * CELL_SIZE;
          
          return (
            <React.Fragment key={agent.id}>
              {/* Unit circle */}
              <Circle
                x={x + CELL_SIZE / 2}
                y={y + CELL_SIZE / 2}
                radius={CELL_SIZE / 3}
                fill={unitColor}
                shadowColor={unitColor}
                shadowBlur={10}
                shadowOpacity={0.5}
                strokeWidth={2}
                stroke={unitColor}
              />
              
              {/* Unit type label */}
              <Text
                x={x}
                y={y + CELL_SIZE + 2}
                width={CELL_SIZE}
                align="center"
                text={agent.type}
                fontSize={10}
                fill={unitColor}
              />

              {/* If unit is moving, draw destination indicator */}
              {agent.destination && (
                <Circle
                  x={agent.destination.x * CELL_SIZE + CELL_SIZE / 2}
                  y={agent.destination.y * CELL_SIZE + CELL_SIZE / 2}
                  radius={CELL_SIZE / 6}
                  stroke={unitColor}
                  strokeWidth={1}
                  dash={[2, 2]}
                  opacity={0.5}
                />
              )}
            </React.Fragment>
          );
        })}
      </Layer>
    </Stage>
  );
} 