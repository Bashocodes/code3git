import { AnalysisResult, MediaType } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export async function analyzeMedia(mediaBase64: string, mediaType: MediaType, selectedModules: any[], visionText?: string): Promise<AnalysisResult> {
  const prompt = generateMediaPrompt(mediaType, visionText);
  const mimeType = getMimeType(mediaBase64, mediaType);
  
  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: mimeType,
            data: mediaBase64.split(',')[1]
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return parseAnalysisResponse(text, visionText);
  } catch (error) {
    console.error('API Error:', error);
    return getMockMediaAnalysis(mediaType, visionText);
  }
}

export async function analyzeText(visionText: string): Promise<AnalysisResult> {
  const prompt = generateTextPrompt(visionText);
  
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return parseAnalysisResponse(text, visionText, true);
  } catch (error) {
    console.error('API Error:', error);
    return getMockTextAnalysis(visionText);
  }
}

// Legacy function for backward compatibility
export async function analyzeImage(imageBase64: string, selectedModules: any[], visionText?: string): Promise<AnalysisResult> {
  return analyzeMedia(imageBase64, 'image', selectedModules, visionText);
}

function getMimeType(mediaBase64: string, mediaType: MediaType): string {
  // Extract mime type from data URL if available
  const mimeMatch = mediaBase64.match(/^data:([^;]+);base64,/);
  if (mimeMatch) {
    return mimeMatch[1];
  }

  // Fallback based on media type
  switch (mediaType) {
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'audio':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}

function parseAnalysisResponse(text: string, visionText?: string, isTextOnly: boolean = false): AnalysisResult {
  // Clean the response text to extract only the JSON
  let cleanedText = text.trim();
  
  // Remove any markdown code blocks if present
  cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  
  // Find the JSON object - look for the first { and last }
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('No valid JSON object found in response');
  }
  
  const jsonString = cleanedText.substring(firstBrace, lastBrace + 1);
  
  return JSON.parse(jsonString);
}

function generateMediaPrompt(mediaType: MediaType, visionText?: string): string {
  const rootLines: string[] = [];

  rootLines.push(
    `IMPORTANT: Your response must be ONLY a single, valid JSON object. Do not include any other text or formatting.`,
    ``,
    `Analyze this ${mediaType} and return a JSON response with the following structure (all keys are required):`,
    `{`,
    `  "title": "2 word creative title",`,
    `  "style": "3 word creative description",`,
    `  "prompt": "Complete description of the ${mediaType === 'audio' ? 'audio content' : 'scene'} in 33 words",`,
    `  "keyTokens": ["exactly","seven","complex","two-word","tokens","best","summarize"],`,
    `  "creativeRemixes": ["enhanced_remix1","enhanced_remix2","enhanced_remix3"],`,
    `  "outpaintingPrompts": ["enhanced_outpainting1","enhanced_outpainting2","enhanced_outpainting3"],`,
    `  "animationPrompts": ["enhanced_video1","enhanced_video2","enhanced_video3"],`,
    `  "musicPrompts": ["enhanced_music1","enhanced_music2","enhanced_music3"],`,
    `  "dialoguePrompts": ["enhanced_dialogue1","enhanced_dialogue2","enhanced_dialogue3"],`,
    `  "storyPrompts": ["enhanced_story1","enhanced_story2","enhanced_story3"]`,
    `}`
  );

  if (visionText && visionText.trim()) {
    rootLines.push(
      ``,
      `The user focus is: "${visionText.trim()}". Emphasize this throughout your analysis and ensure the tokens reflect this focus.`
    );
  }

  rootLines.push(...getExpertGuidelines(mediaType));
  return rootLines.join("\n");
}

function generateTextPrompt(visionText: string): string {
  const rootLines: string[] = [];

  rootLines.push(
    `IMPORTANT: Your response must be ONLY a single, valid JSON object. Do not include any other text or formatting.`,
    ``,
    `Based on the text concept provided, create a comprehensive creative analysis as if analyzing a visual artwork. Return a JSON response with the following structure (all keys are required):`,
    `{`,
    `  "title": "2 word creative title based on the concept",`,
    `  "style": "3 word creative description of the imagined visual style",`,
    `  "prompt": "Complete visual description of how this concept would look as an artwork in 33 words",`,
    `  "keyTokens": ["exactly","seven","complex","two-word","tokens","best","summarize"],`,
    `  "creativeRemixes": ["enhanced_remix1","enhanced_remix2","enhanced_remix3"],`,
    `  "outpaintingPrompts": ["enhanced_outpainting1","enhanced_outpainting2","enhanced_outpainting3"],`,
    `  "animationPrompts": ["enhanced_video1","enhanced_video2","enhanced_video3"],`,
    `  "musicPrompts": ["enhanced_music1","enhanced_music2","enhanced_music3"],`,
    `  "dialoguePrompts": ["enhanced_dialogue1","enhanced_dialogue2","enhanced_dialogue3"],`,
    `  "storyPrompts": ["enhanced_story1","enhanced_story2","enhanced_story3"]`,
    `}`
  );

  rootLines.push(
    ``,
    `The user concept is: "${visionText.trim()}". Create a deep, intricate analysis exploring all creative dimensions of this concept as if it were a rich visual artwork. Imagine how this concept would manifest visually and provide comprehensive creative interpretations across all categories.`
  );

  rootLines.push(...getExpertGuidelines('image'));
  return rootLines.join("\n");
}

function getExpertGuidelines(mediaType: MediaType): string[] {
  const mediaSpecificGuidelines = getMediaSpecificGuidelines(mediaType);
  
  return [
    ``,
    `CRITICAL: The keyTokens array MUST contain exactly seven two-word tokens that are the most important, complex, and specific descriptors that best capture the essence of the ${mediaType}. These should be sophisticated combinations that represent the core visual, stylistic, and thematic elements.`,
    ``,
    `You are operating in EXPERT mode. Provide deeply specific, unconventional, highly detailed creative outputs.`,
    ``,
    ...mediaSpecificGuidelines,
    ``,
    `**Key Token Requirements:**`,
    `- keyTokens: Exactly 7 two-word tokens that best summarize the ${mediaType}. These should be the most important descriptors covering composition, atmosphere, style, and theme. Examples: "neon cyberpunk", "gothic architecture", "ethereal lighting", "vintage aesthetic", "dynamic composition", "surreal atmosphere", "cinematic depth"`,
    ``,
    `**Other Module Requirements:**`,
    `- For "prompt": Create a complete 33-word description that captures the essence with vivid detail and artistic language.`,
    `- For "creativeRemixes": Generate exactly 3 complete reimagined descriptions of 15-21 words each that transform the original into new genres or styles.`,
    `- For "outpaintingPrompts": Create exactly 3 complete descriptions of 15-21 words each that expand beyond the current scope.`,
    `- For "animationPrompts": Provide exactly 3 complete descriptions of 15-21 words each for video animation that can be captured in 5 seconds maximum.`,
    `- For "musicPrompts": Provide exactly 3 music style descriptions, each 150-180 characters long.`,
    `- For "dialoguePrompts": Provide exactly 3 dialogue/narration prompts of 5-7 words each that can be spoken in 5-10 seconds.`,
    `- For "storyPrompts": Generate exactly 3 unique stories of 15-21 words each with increasing creativity and imagination.`,
    ``,
    `REMEMBER: Your entire response must be valid JSON only. No additional text or explanations outside the JSON structure.`
  ];
}

function getMediaSpecificGuidelines(mediaType: MediaType): string[] {
  switch (mediaType) {
    case 'image':
      return [
        `**IMAGE ANALYSIS FOCUS:**`,
        `- Analyze visual composition, lighting, color palette, and artistic style`,
        `- Focus on visual elements, subjects, and aesthetic qualities`,
        `- Consider photographic or artistic techniques used`
      ];
    case 'video':
      return [
        `**VIDEO ANALYSIS FOCUS:**`,
        `- Analyze visual composition, movement, pacing, and cinematography`,
        `- Focus on key frames, transitions, and visual storytelling elements`,
        `- Consider camera work, editing style, and temporal flow`,
        `- Extract the most visually striking and representative moments`
      ];
    case 'audio':
      return [
        `**AUDIO ANALYSIS FOCUS:**`,
        `- Analyze sonic composition, rhythm, melody, and audio texture`,
        `- Focus on musical elements, sound design, and auditory atmosphere`,
        `- Consider instrumentation, production style, and emotional tone`,
        `- Translate audio qualities into visual and creative concepts`,
        `- For key tokens, think of audio structure as visual descriptors`
      ];
    default:
      return [];
  }
}

function getMockMediaAnalysis(mediaType: MediaType, visionText?: string): AnalysisResult {
  const hasVisionFocus = visionText && visionText.trim();
  
  const baseAnalysis = {
    keyTokens: ["cybernetic portrait", "neon lighting", "futuristic aesthetic", "digital enhancement", "synthetic beauty", "technological fusion", "ethereal glow"],
    creativeRemixes: [
      "Transform into medieval fantasy setting with magical elements replacing technological components in mystical environment.",
      "Reimagine as 1920s art deco style with geometric patterns and luxurious vintage aesthetic throughout composition.",
      "Convert to underwater scene with bioluminescent features and flowing aquatic elements creating ethereal atmosphere."
    ],
    outpaintingPrompts: [
      "Reveal vast surrounding environment with additional contextual elements extending beyond current boundaries of content.",
      "Expand to show broader narrative context with supporting characters and environmental details in background.",
      "Extend scope to include temporal elements showing progression and development of central theme."
    ],
    animationPrompts: [
      "Gentle rhythmic motion with subtle environmental changes and soft transitions creating peaceful flowing movement.",
      "Dynamic transformation sequence with dramatic lighting changes and particle effects building visual intensity.",
      "Cinematic camera movement revealing hidden details and creating immersive storytelling experience through motion."
    ],
    musicPrompts: [
      "Ethereal ambient soundscape with layered textures, evolving harmonies, and subtle rhythmic elements creating immersive atmospheric experience perfect for contemplation.",
      "Dynamic orchestral composition featuring dramatic crescendos, intricate melodies, and rich instrumentation that captures emotional depth and narrative complexity.",
      "Electronic fusion with synthesized textures, rhythmic patterns, and digital processing creating modern sonic interpretation of visual themes."
    ],
    dialoguePrompts: [
      "The essence of transformation unfolds",
      "Where reality meets imagination",
      "Beyond the realm of possibility"
    ],
    storyPrompts: [
      "A simple discovery becomes the catalyst for extraordinary personal transformation and unexpected journey of growth.",
      "An intricate narrative exploring how seemingly unrelated elements connect across different dimensions of experience.",
      "A surreal adventure where boundaries between different realities blur creating infinite possibilities for exploration."
    ]
  };

  switch (mediaType) {
    case 'image':
      return {
        title: hasVisionFocus ? "Vision Focused" : "Cybernetic Awakening",
        style: hasVisionFocus ? "Custom Analysis" : "Futuristic Portrait",
        prompt: hasVisionFocus 
          ? `Analysis focused on your vision: "${visionText}" revealing hidden depths and artistic elements within the composition through targeted examination.`
          : "A young cyborg woman with platinum hair stands in ornate bathroom, synthetic skin glistening with moisture against warm ambient lighting.",
        keyTokens: hasVisionFocus 
          ? ["vision focused", "custom analysis", "targeted examination", "artistic elements", "hidden depths", "composition study", "creative interpretation"]
          : ["cybernetic portrait", "neon lighting", "futuristic aesthetic", "digital enhancement", "synthetic beauty", "technological fusion", "ethereal glow"],
        ...baseAnalysis
      };
    
    case 'video':
      return {
        title: hasVisionFocus ? "Motion Vision" : "Cinematic Flow",
        style: hasVisionFocus ? "Dynamic Analysis" : "Moving Narrative",
        prompt: hasVisionFocus 
          ? `Video analysis focused on your vision: "${visionText}" capturing movement, transitions, and temporal elements within the dynamic composition.`
          : "Dynamic sequence showing fluid camera movements through futuristic environments with dramatic lighting transitions and character interactions creating cinematic storytelling.",
        keyTokens: hasVisionFocus 
          ? ["motion vision", "dynamic analysis", "temporal elements", "movement capture", "transition focus", "cinematic flow", "video interpretation"]
          : ["cinematic flow", "camera movement", "lighting transitions", "dynamic sequence", "visual storytelling", "temporal narrative", "motion aesthetics"],
        ...baseAnalysis
      };
    
    case 'audio':
      return {
        title: hasVisionFocus ? "Sonic Vision" : "Audio Landscape",
        style: hasVisionFocus ? "Sound Analysis" : "Musical Journey",
        prompt: hasVisionFocus 
          ? `Audio analysis focused on your vision: "${visionText}" translating sonic elements into visual concepts and creative interpretations.`
          : "Rich layered soundscape featuring ethereal melodies, rhythmic percussion, and atmospheric textures creating immersive auditory experience with emotional depth.",
        keyTokens: hasVisionFocus 
          ? ["sonic vision", "sound analysis", "audio interpretation", "musical concepts", "rhythmic elements", "harmonic structure", "auditory aesthetics"]
          : ["layered soundscape", "ethereal melodies", "rhythmic percussion", "atmospheric textures", "auditory experience", "emotional depth", "sonic composition"],
        ...baseAnalysis
      };
    
    default:
      return baseAnalysis as AnalysisResult;
  }
}

function getMockTextAnalysis(visionText: string): AnalysisResult {
  return {
    title: "Text Vision",
    style: "Conceptual Interpretation",
    prompt: `Imagined visual representation of "${visionText}" manifesting as rich artistic composition with intricate details and symbolic elements throughout the creative space.`,
    keyTokens: ["conceptual vision", "symbolic representation", "artistic interpretation", "creative manifestation", "visual metaphor", "thematic exploration", "imaginative rendering"],
    creativeRemixes: [
      `Transform "${visionText}" into surreal dreamscape with floating elements and impossible geometries creating otherworldly atmosphere.`,
      `Reimagine "${visionText}" as minimalist zen composition with clean lines and negative space emphasizing essential elements.`,
      `Convert "${visionText}" into baroque maximalist scene with ornate details and dramatic lighting creating rich visual complexity.`
    ],
    outpaintingPrompts: [
      `Expand beyond "${visionText}" to reveal broader context and environmental elements that support the central concept.`,
      `Extend the concept of "${visionText}" into surrounding narrative spaces showing cause and effect relationships.`,
      `Broaden "${visionText}" to include temporal elements showing past, present, and future implications of the concept.`
    ],
    animationPrompts: [
      `Gentle conceptual transformation of "${visionText}" with subtle morphing elements and flowing symbolic transitions.`,
      `Dynamic interpretation of "${visionText}" with rhythmic pulsing and organic movement patterns creating living artwork.`,
      `Cinematic exploration of "${visionText}" with dramatic reveals and cascading visual metaphors building narrative tension.`
    ],
    musicPrompts: [
      `Ambient soundscape reflecting the essence of "${visionText}" with layered textures, evolving harmonies, and subtle rhythmic elements that mirror the conceptual depth and emotional resonance.`,
      `Orchestral composition inspired by "${visionText}" featuring dynamic crescendos, intricate melodies, and rich instrumentation that captures the full emotional and thematic spectrum.`,
      `Electronic interpretation of "${visionText}" with synthesized textures, rhythmic patterns, and digital processing that creates a modern sonic representation of the concept.`
    ],
    dialoguePrompts: [
      `The essence of ${visionText.split(' ')[0] || 'concept'}`,
      `Where ${visionText.split(' ')[0] || 'dreams'} become reality`,
      `Beyond the realm of ${visionText.split(' ')[0] || 'imagination'}`
    ],
    storyPrompts: [
      `A simple tale where "${visionText}" becomes the catalyst for unexpected personal transformation and growth.`,
      `An intricate narrative exploring how "${visionText}" connects seemingly unrelated characters across different time periods.`,
      `A surreal journey where "${visionText}" exists as both destination and guide through impossible landscapes of meaning.`
    ]
  };
}