'use client';

import type React from 'react';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
  barCount?: number;
  barColor?: string;
  visualizerType?: 'waveform' | 'frequency';
}

export function AudioVisualizer({
  audioRef,
  isPlaying,
  className,
  barCount = 64,
  barColor = '#ef4444', // red-500
  visualizerType = 'frequency',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(
    null
  );
  const animationRef = useRef<number>(0);
  const audioSetupAttempted = useRef(false);

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioRef.current || audioSetupAttempted.current) return;

    const initializeAudio = () => {
      try {
        // Create audio context
        const context = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        setAudioContext(context);

        // Create analyzer
        const audioAnalyser = context.createAnalyser();
        audioAnalyser.fftSize = visualizerType === 'waveform' ? 2048 : 256;
        setAnalyser(audioAnalyser);

        // Create buffer
        const bufferLength =
          visualizerType === 'waveform'
            ? audioAnalyser.fftSize
            : audioAnalyser.frequencyBinCount;
        const array = new Uint8Array(bufferLength);
        setDataArray(array);

        // Connect audio source to analyzer
        const audioSource = context.createMediaElementSource(audioRef.current);
        audioSource.connect(audioAnalyser);

        // IMPORTANT: Connect analyzer to destination (speakers)
        audioAnalyser.connect(context.destination);

        setSource(audioSource);
        audioSetupAttempted.current = true;

        console.log('Audio visualizer initialized successfully');
      } catch (error) {
        console.error('Error initializing audio analyzer:', error);
      }
    };

    // Only initialize when audio starts playing to avoid autoplay restrictions
    const handlePlay = () => {
      if (!audioSetupAttempted.current) {
        initializeAudio();
      }
    };

    audioRef.current.addEventListener('play', handlePlay);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handlePlay);
      }
      if (audioContext?.state !== 'closed') {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef, visualizerType]);

  // Animation loop for visualization
  useEffect(() => {
    if (!analyser || !dataArray || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      if (!isPlaying) {
        // Draw flat line when not playing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      animationRef.current = requestAnimationFrame(renderFrame);

      if (visualizerType === 'waveform') {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (visualizerType === 'waveform') {
        // Draw waveform
        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        ctx.lineWidth = 2;
        ctx.strokeStyle = barColor;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        // Draw frequency bars
        const barWidth = canvas.width / barCount;
        let x = 0;

        for (let i = 0; i < barCount; i++) {
          // Use a subset of the frequency data for better visualization
          const index = Math.floor(i * (dataArray.length / barCount));
          const barHeight = (dataArray[index] / 255) * canvas.height;

          // Create gradient for bars
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, barColor + '40'); // Transparent at bottom
          gradient.addColorStop(1, barColor); // Solid at top

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }
      }
    };

    if (isPlaying) {
      renderFrame();
    } else {
      cancelAnimationFrame(animationRef.current);
      // Draw flat line when not playing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    analyser,
    dataArray,
    canvasRef,
    isPlaying,
    barColor,
    barCount,
    visualizerType,
  ]);

  // Resize canvas on window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-12 rounded-md', className)}
      style={{ display: 'block' }} // Ensure canvas is visible
    />
  );
}
