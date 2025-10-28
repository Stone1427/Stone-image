
import React, { useState, useCallback, useMemo } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, LoadingSpinnerIcon } from './components/Icons';

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] =useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = useCallback(async (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setError(null);
      setEditedImage(null);
      setIsLoading(true);
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage({
          base64: base64,
          mimeType: file.type,
          name: file.name
        });
      } catch (err) {
        setError('Failed to load image. Please try another one.');
        setOriginalImage(null);
      } finally {
        setIsLoading(false);
      }
    } else if (file) {
      setError('Please select a valid image file.');
      setOriginalImage(null);
    }
  }, []);
  
  const handleDragEvent = (e: React.DragEvent<HTMLDivElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isOver);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvent(e, false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!originalImage || !prompt || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const generatedImage = await editImageWithPrompt(
        originalImage.base64,
        originalImage.mimeType,
        prompt
      );
      if (generatedImage) {
        setEditedImage(`data:image/png;base64,${generatedImage}`);
      } else {
        throw new Error('The model did not return an image. Try a different prompt.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const originalImageSrc = useMemo(() => {
    if (!originalImage) return null;
    return `data:${originalImage.mimeType};base64,${originalImage.base64}`;
  }, [originalImage]);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Application alimentée par la nano-banane
        </h1>
        <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
          Ajoutez de puissantes fonctionnalités de retouche photo à votre application. Permettez aux utilisateurs d'ajouter des objets, de supprimer des arrière-plans ou de modifier le style d'une photo par simple saisie.
        </p>
      </header>

      <main className="w-full max-w-6xl flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-800' : 'border-gray-600 hover:border-gray-500'}`}
          onDragOver={(e) => handleDragEvent(e, true)}
          onDragLeave={(e) => handleDragEvent(e, false)}
          onDrop={handleDrop}
        >
          {originalImageSrc ? (
            <img src={originalImageSrc} alt="Original" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
          ) : (
            <div className="text-center">
              <UploadIcon className="w-16 h-16 mx-auto text-gray-500" />
              <p className="mt-4 text-lg">Drag & drop an image here</p>
              <p className="text-gray-400">or</p>
              <label htmlFor="file-upload" className="mt-2 inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors">
                Browse Files
              </label>
              <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={onFileInputChange} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-2xl bg-gray-800/50">
          {isLoading && !editedImage && (
             <div className="text-center">
                <LoadingSpinnerIcon className="w-16 h-16 mx-auto" />
                <p className="mt-4 text-lg animate-pulse">Gemini is thinking...</p>
             </div>
          )}
          {error && (
            <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          {editedImage && !isLoading && (
            <img src={editedImage} alt="Edited" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
          )}
          {!isLoading && !error && !editedImage && (
            <div className="text-center">
              <SparklesIcon className="w-16 h-16 mx-auto text-gray-500" />
              <p className="mt-4 text-lg">Your edited image will appear here</p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl mt-8 p-4 bg-gray-800/50 rounded-xl sticky bottom-4 shadow-lg backdrop-blur-sm border border-gray-700">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a retro filter, make it black and white..."
            className="w-full flex-grow bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow resize-none"
            rows={2}
            disabled={!originalImage || isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!originalImage || !prompt || isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isLoading ? <LoadingSpinnerIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
            <span>Generate</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
