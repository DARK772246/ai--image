import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio } from '../types';

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateImageFromPrompt = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("Image generation failed or returned no images.");
};

const getMimeTypeFromDataUrl = (dataUrl: string): string => {
    return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
}

const getBase64FromDataUrl = (dataUrl: string): string => {
    return dataUrl.substring(dataUrl.indexOf(',') + 1);
}

export const editImageWithPrompt = async (base64ImageData: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    
    const pureBase64 = getBase64FromDataUrl(base64ImageData);
    const mimeType = getMimeTypeFromDataUrl(base64ImageData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: pureBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image editing failed or returned no images.");
};

export const upscaleImage = async (base64ImageData: string): Promise<string> => {
    const ai = getAiClient();
    
    const pureBase64 = getBase64FromDataUrl(base64ImageData);
    const mimeType = getMimeTypeFromDataUrl(base64ImageData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: pureBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: 'Upscale this image to a higher resolution. Enhance details, clarity, and overall quality without altering the subject or style.',
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image upscaling failed or returned no images.");
};

export const applyStyleTransfer = async (base64ImageData: string, style: string): Promise<string> => {
    const ai = getAiClient();
    
    const pureBase64 = getBase64FromDataUrl(base64ImageData);
    const mimeType = getMimeTypeFromDataUrl(base64ImageData);

    const prompt = `Apply the artistic style of "${style}" to the following image. The core subject, composition, and elements of the image should remain the same, but the entire visual aesthetic, including colors, textures, and brushwork, should be transformed to match the chosen style.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: pureBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Style transfer failed or returned no images.");
};

export const replaceFace = async (targetImage: string, sourceFaceImage: string): Promise<string> => {
    const ai = getAiClient();
    
    const targetPureBase64 = getBase64FromDataUrl(targetImage);
    const targetMimeType = getMimeTypeFromDataUrl(targetImage);
    
    const sourcePureBase64 = getBase64FromDataUrl(sourceFaceImage);
    const sourceMimeType = getMimeTypeFromDataUrl(sourceFaceImage);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                  text: "You are an expert in photo editing. Your task is to replace a face in a target image with a face from a source image. \n\nIMPORTANT: \n- The first image provided is the **target image** where the face needs to be replaced. \n- The second image is the **source image** containing the face to use. \n- Identify the most prominent face in the target image and replace it with the face from the source image. \n- Seamlessly blend the new face, matching lighting, skin tone, shadows, and angle for a natural and realistic result. \n- Do not alter any other part of the target image's background or composition.",
                },
                {
                    inlineData: { data: targetPureBase64, mimeType: targetMimeType },
                },
                {
                    inlineData: { data: sourcePureBase64, mimeType: sourceMimeType },
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Face replacement failed or returned no image.");
}