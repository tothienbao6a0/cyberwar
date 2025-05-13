'use client';

import React from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { Agent } from '@/lib/ai/agent';
import { useEffect, useState, useCallback } from 'react';
import Konva from 'konva';

// Constants for battlefield visualization
const CELL_SIZE = 40; // Size of each grid cell in pixels
const MIN_SCALE = 0.5; // Minimum zoom level
const MAX_SCALE = 2; // Maximum zoom level
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
  // Calculate grid dimensions to fit the window
  // Leave some padding and account for coordinate labels
  const GRID_WIDTH = Math.floor((width - 40) / CELL_SIZE); // 40px for labels and padding
  const GRID_HEIGHT = Math.floor((height - 40) / CELL_SIZE);
  
  // Calculate the actual grid size in pixels
  const gridWidthPx = GRID_WIDTH * CELL_SIZE;
  const gridHeightPx = GRID_HEIGHT * CELL_SIZE;

  // Center position (fixed unless zoomed)
  const centerX = (width - gridWidthPx) / 2;
  const centerY = (height - gridHeightPx) / 2;

  // State for stage position and scale
  const [stagePos, setStagePos] = useState({ x: centerX, y: centerY });
  const [stageScale, setStageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Only allow dragging when zoomed in
  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (stageScale <= 1) {
      e.target.stopDrag();
      return;
    }
    setIsDragging(true);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (stageScale <= 1) return;
    setIsDragging(false);
    
    // When zoomed, allow dragging within bounds
    const stage = e.target;
    const pos = stage.position();
    
    const minX = Math.min(centerX, width - gridWidthPx * stageScale);
    const maxX = Math.max(centerX, 0);
    const minY = Math.min(centerY, height - gridHeightPx * stageScale);
    const maxY = Math.max(centerY, 0);
    
    const newX = Math.min(maxX, Math.max(minX, pos.x));
    const newY = Math.min(maxY, Math.max(minY, pos.y));
    
    setStagePos({ x: newX, y: newY });
  };
  
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

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    // If zooming out to normal size or smaller, reset position to center
    if (newScale <= 1) {
      setStagePos({ x: centerX, y: centerY });
    } else {
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      
      const minX = Math.min(centerX, width - gridWidthPx * newScale);
      const maxX = Math.max(centerX, 0);
      const minY = Math.min(centerY, height - gridHeightPx * newScale);
      const maxY = Math.max(centerY, 0);
      
      newPos.x = Math.min(maxX, Math.max(minX, newPos.x));
      newPos.y = Math.min(maxY, Math.max(minY, newPos.y));
      
      setStagePos(newPos);
    }
    
    setStageScale(newScale);
  };

  // Create fixed grid lines
  const renderGrid = useCallback(() => {
    const lines = [];

    // Vertical lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
      lines.push(
        <Rect
          key={`v-${x}`}
          x={x * CELL_SIZE}
          y={0}
          width={1}
          height={gridHeightPx}
          fill="#202932"
          opacity={GRID_ALPHA}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      lines.push(
        <Rect
          key={`h-${y}`}
          x={0}
          y={y * CELL_SIZE}
          width={gridWidthPx}
          height={1}
          fill="#202932"
          opacity={GRID_ALPHA}
        />
      );
    }

    // Add coordinate labels
    for (let x = 0; x <= GRID_WIDTH; x += 5) {
      lines.push(
        <Text
          key={`label-x-${x}`}
          x={x * CELL_SIZE}
          y={gridHeightPx + 5}
          text={x.toString()}
          fontSize={10}
          fill="#202932"
          align="center"
          width={CELL_SIZE}
        />
      );
    }

    for (let y = 0; y <= GRID_HEIGHT; y += 5) {
      lines.push(
        <Text
          key={`label-y-${y}`}
          x={-20}
          y={y * CELL_SIZE - 5}
          text={y.toString()}
          fontSize={10}
          fill="#202932"
          align="right"
        />
      );
    }

    return lines;
  }, [GRID_WIDTH, GRID_HEIGHT, gridHeightPx, gridWidthPx]);

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
        {/* Background for the grid */}
        <Rect
          x={0}
          y={0}
          width={gridWidthPx}
          height={gridHeightPx}
          fill="#0A0F14"
          stroke="#202932"
          strokeWidth={2}
        />
        
        {/* Draw fixed grid */}
        {renderGrid()}

        {/* Draw agents */}
        {agents.map((agent) => {
          // Only render agents within the grid bounds
          if (agent.position.x < 0 || agent.position.x >= GRID_WIDTH ||
              agent.position.y < 0 || agent.position.y >= GRID_HEIGHT) {
            return null;
          }
          
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

              {/* If unit is moving, draw destination indicator (only if destination is within bounds) */}
              {agent.destination && 
               agent.destination.x >= 0 && agent.destination.x < GRID_WIDTH &&
               agent.destination.y >= 0 && agent.destination.y < GRID_HEIGHT && (
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