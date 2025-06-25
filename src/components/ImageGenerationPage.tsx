import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Sparkles, Download, Copy, Check } from 'lucide-react';
import { generateImage, ImageGenerationResult } from '../utils/imageApi';
import { copyToClipboard } from '../utils/clipboard';

interface ImageGenerationPageProps {
  initialPrompt?: string;
  onClose: () => void;
}

export function ImageGenerationPage({ initialPrompt = '', onClose }: ImageGenerationPageProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [selectedModel, setSelectedModel] = useState<'ray-1-6' | 'ray-2' | 'ray-flash-2' | 'dall-e-3' | 'gpt-image-1'>('ray-1-6');
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto'>('medium');
  const [loadingDots, setLoadingDots] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 48;
      const maxHeight = 200;
      const newHeight = Math.max(Math.min(scrollHeight, maxHeight), minHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  // Animated loading dots effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
    } else {
      setLoadingDots('');
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Reset quality when model changes
  useEffect(() => {
    if (selectedModel === 'dall-e-3') {
      setSelectedQuality('standard');
    } else if (selectedModel === 'gpt-image-1') {
      setSelectedQuality('auto');
    } else {
      setSelectedQuality('medium');
    }
  }, [selectedModel]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateImage({
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        model: selectedModel,
        quality: selectedQuality,
      });
      
      setGeneratedImage(result);
    } catch (err) {
      console.error('💥 Generation Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage?.url) return;

    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedModel}-generated-${generatedImage.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCopyPrompt = async () => {
    const textToCopy = prompt;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const aspectRatioOptions = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
  ];

  const modelOptions = [
    { value: 'ray-1-6', label: 'Luma Ray 1.6', provider: 'Luma Labs' },
    { value: 'ray-2', label: 'Ray 2', provider: 'Luma Labs' },
    { value: 'ray-flash-2', label: 'Ray Flash 2', provider: 'Luma Labs' },
    { value: 'gpt-image-1', label: 'GPT Image 1', provider: 'OpenAI' },
    { value: 'dall-e-3', label: 'DALL-E 3', provider: 'OpenAI' },
  ];

  const getQualityOptions = () => {
    if (selectedModel === 'dall-e-3') {
      return [
        { value: 'standard', label: 'Standard Quality' },
        { value: 'hd', label: 'HD Quality' },
      ];
    } else if (selectedModel === 'gpt-image-1') {
      return [
        { value: 'auto', label: 'Auto (Recommended)' },
        { value: 'low', label: 'Low Quality (Fast)' },
        { value: 'medium', label: 'Medium Quality' },
        { value: 'high', label: 'High Quality (Slow)', disabled: true },
      ];
    } else {
      // Luma models
      return [
        { value: 'low', label: 'Low Quality (Fast)' },
        { value: 'medium', label: 'Medium Quality' },
        { value: 'high', label: 'High Quality (Slow)' },
      ];
    }
  };

  const getModelDisplayName = () => {
    const model = modelOptions.find(m => m.value === selectedModel);
    return model ? `${model.label}` : selectedModel;
  };

  const getQualityDisplayName = () => {
    const qualityOptions = getQualityOptions();
    const quality = qualityOptions.find(q => q.value === selectedQuality);
    return quality ? quality.label : selectedQuality;
  };

  return (
    <div className="pt-16 h-screen overflow-hidden">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Generated Image Section - Left Side */}
        <div className="w-2/3 p-4 flex items-center justify-center relative">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#B8A082] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/70 text-lg font-mono">generating image{loadingDots}</p>
            </div>
          ) : generatedImage ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img
                src={generatedImage.url}
                alt="Generated artwork"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={handleDownload}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                title="Download image"
              >
                <Download size={16} className="text-white" />
              </button>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 text-base mb-2">Generation Failed</p>
              <p className="text-white/50 text-sm max-w-md">{error}</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#B8A082]" />
              </div>
              <p className="text-white/70 text-lg mb-2">Ready to Generate</p>
              <p className="text-white/50 text-sm">Enter your prompt and select a model to create an image</p>
            </div>
          )}
        </div>

        {/* Control Panel - Right Side - Consistent with decode page styling */}
        <div className="w-1/3 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="rounded-2xl bg-black/50 backdrop-blur-md shadow-inner relative p-4">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={onClose}
                    className="p-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title="Back to main page"
                  >
                    <ArrowLeft size={16} className="text-white" />
                  </button>
                  <h1 className="text-2xl font-light text-[#E6E6E6] flex-1" style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}>
                    Image Creation
                  </h1>
                  <div className="text-[#B8A082]">
                    <Sparkles size={20} />
                  </div>
                </div>
                <div className="font-mono text-[#E6E6E6] text-sm lowercase tracking-wider opacity-80">
                  ai generation
                </div>
              </div>

              {/* AI Model Selection */}
              <div className="mb-4">
                <div className="bg-[#1A1A1A] border border-[#1B1B1B] rounded-lg px-3 py-1 mb-2 inline-block">
                  <label className="text-[#E6E6E6] opacity-80 font-mono text-xs uppercase">
                    AI Model
                  </label>
                </div>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-xl px-3 py-2 text-[#E6E6E6] opacity-80 focus:outline-none focus:border-[#B8A082] focus:bg-[#1A1A1A] transition-all text-sm"
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#1a1a1a]">
                      {option.label} ({option.provider})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prompt Input */}
              <div className="mb-4">
                <div className="bg-[#1A1A1A] border border-[#1B1B1B] rounded-lg px-3 py-1 mb-2 inline-block">
                  <label className="text-[#E6E6E6] opacity-80 font-mono text-xs uppercase">
                    Prompt
                  </label>
                </div>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full p-2 rounded-2xl bg-[#1A1A1A] text-[#E6E6E6] opacity-80 placeholder-[#E6E6E6]/50 focus:outline-none focus:border-[#B8A082] focus:bg-[#1A1A1A] transition-all resize-none overflow-hidden min-h-[48px] leading-relaxed text-sm font-mono border border-white/20"
                  rows={3}
                />
              </div>

              {/* Aspect Ratio Selection */}
              <div className="mb-4">
                <div className="bg-[#1A1A1A] border border-[#1B1B1B] rounded-lg px-3 py-1 mb-2 inline-block">
                  <label className="text-[#E6E6E6] opacity-80 font-mono text-xs uppercase">
                    Aspect Ratio
                  </label>
                </div>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-xl px-3 py-2 text-[#E6E6E6] opacity-80 focus:outline-none focus:border-[#B8A082] focus:bg-[#1A1A1A] transition-all text-sm"
                >
                  {aspectRatioOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#1a1a1a]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Selection */}
              <div className="mb-6">
                <div className="bg-[#1A1A1A] border border-[#1B1B1B] rounded-lg px-3 py-1 mb-2 inline-block">
                  <label className="text-[#E6E6E6] opacity-80 font-mono text-xs uppercase">
                    Quality
                  </label>
                </div>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value as any)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-xl px-3 py-2 text-[#E6E6E6] opacity-80 focus:outline-none focus:border-[#B8A082] focus:bg-[#1A1A1A] transition-all text-sm"
                >
                  {getQualityOptions().map((option) => (
                    <option 
                      key={option.value} 
                      value={option.value} 
                      className={`bg-[#1a1a1a] ${option.disabled ? 'text-gray-500' : ''}`}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button - Styled like decode page button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all font-semibold text-lg ${
                  prompt.trim() && !isGenerating
                    ? 'bg-[#D5C3A5] hover:bg-[#C5B395] text-[#0E0E0E] shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    : 'bg-[#1A1A1A] text-[#E6E6E6] opacity-40 cursor-not-allowed'
                }`}
                style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}