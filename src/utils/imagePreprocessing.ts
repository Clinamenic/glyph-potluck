// Image preprocessing utilities for vectorization
import type { VectorizationQuality } from '@/types';

export interface PreprocessingOptions {
  quality: VectorizationQuality;
  targetSize?: number;
  contrastEnhancement?: number;
  noiseReduction?: boolean;
}

/**
 * Convert image to grayscale and enhance contrast for better vectorization
 */
export function preprocessImage(
  canvas: HTMLCanvasElement, 
  options: PreprocessingOptions
): HTMLCanvasElement {
  console.log('🔧 Preprocessing image for vectorization...', options);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const processedData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Step 1: Convert to grayscale
  console.log('📝 Converting to grayscale...');
  toGrayscale(processedData);

  // Step 2: Apply gentle smoothing to eliminate pixel irregularities causing jags
  console.log('🔧 Applying gentle smoothing to eliminate pixel irregularities...');
  applyGentleSmoothing(processedData);
  
  // Step 3: Apply minimal noise reduction to clean edges
  if (options.quality === 'high' && options.noiseReduction !== false) {
    console.log('🧹 Applying gentle noise reduction...');
    reduceNoise(processedData);
  }

  // Step 4: Create new canvas with processed image
  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = imageData.width;
  processedCanvas.height = imageData.height;
  const processedCtx = processedCanvas.getContext('2d')!;
  processedCtx.putImageData(processedData, 0, 0);

  console.log('✅ Image preprocessing completed');
  return processedCanvas;
}

/**
 * Convert ImageData to grayscale
 */
function toGrayscale(imageData: ImageData): void {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Use luminance formula for better grayscale conversion
    const gray = Math.round(
      0.299 * data[i] +     // Red
      0.587 * data[i + 1] + // Green
      0.114 * data[i + 2]   // Blue
    );
    
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha channel (i + 3) remains unchanged
  }
}

/**
 * Enhance contrast using a sigmoid function
 */
function enhanceContrast(imageData: ImageData, intensity: number): void {
  const data = imageData.data;
  const factor = (259 * (intensity + 255)) / (255 * (259 - intensity));
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast enhancement to RGB channels
    for (let j = 0; j < 3; j++) {
      let value = data[i + j];
      value = factor * (value - 128) + 128;
      data[i + j] = Math.max(0, Math.min(255, value));
    }
  }
}

/**
 * Apply gentle smoothing to eliminate pixel irregularities that cause jags
 */
function applyGentleSmoothing(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const originalData = new Uint8ClampedArray(data);
  
  // Use a gentle 3x3 gaussian-like blur to smooth pixel irregularities
  const kernel = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ];
  const kernelSum = 16;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let weightedSum = 0;
        
        // Apply 3x3 kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            weightedSum += originalData[pixelIndex] * kernel[kernelIndex];
          }
        }
        
        const currentIndex = (y * width + x) * 4 + c;
        data[currentIndex] = Math.round(weightedSum / kernelSum);
      }
    }
  }
}

/**
 * Simple noise reduction using a 3x3 median filter
 */
function reduceNoise(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const originalData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        const neighbors: number[] = [];
        
        // Collect 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const index = ((y + dy) * width + (x + dx)) * 4 + c;
            neighbors.push(originalData[index]);
          }
        }
        
        // Apply median filter
        neighbors.sort((a, b) => a - b);
        const medianValue = neighbors[4]; // Middle value of 9 elements
        
        const currentIndex = (y * width + x) * 4 + c;
        data[currentIndex] = medianValue;
      }
    }
  }
}

/**
 * Get contrast enhancement level based on quality setting
 */
function getContrastLevel(quality: VectorizationQuality): number {
  switch (quality) {
    case 'fast':
      return 30; // Light contrast enhancement
    case 'balanced':
      return 50; // Moderate contrast enhancement
    case 'high':
      return 70; // Strong contrast enhancement
    default:
      return 50;
  }
}

/**
 * Resize image if it's too large for processing
 */
export function resizeIfNeeded(
  canvas: HTMLCanvasElement, 
  maxSize: number = 1024
): HTMLCanvasElement {
  const { width, height } = canvas;
  
  if (width <= maxSize && height <= maxSize) {
    console.log('📏 Image size is optimal, no resizing needed');
    return canvas;
  }
  
  // Calculate new dimensions maintaining aspect ratio
  const scale = Math.min(maxSize / width, maxSize / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  console.log(`📏 Resizing image: ${width}x${height} → ${newWidth}x${newHeight}`);
  
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;
  
  const ctx = resizedCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  return resizedCanvas;
}

/**
 * Convert uploaded file to canvas for processing
 */
export function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    console.log('🖼️ Converting file to canvas...', { name: file.name, size: file.size });
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      console.log(`✅ Canvas created: ${canvas.width}x${canvas.height}`);
      resolve(canvas);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Canvas to ImageTracer data conversion is handled directly by ImageTracer
