import React, { useState, useCallback, useMemo } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, LoadingSpinnerIcon, DownloadIcon, EyeIcon, WandIcon } from './components/Icons';

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

const STYLE_PRESETS = [
  "Cyberpunk", "Aquarelle", "Pixel Art", "Dessin au crayon", 
  "Photo réaliste", "Cartoon 3D", "Origami", "Vapeurwave", "Noir et blanc", "Studio Ghibli"
];

const ENHANCEMENTS = [
  "Éclairage cinématique", "Haute résolution 4k", "Couleurs vives", "Arrière-plan flou", "HDR", "Minimaliste"
];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

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

  const addPromptToken = (token: string) => {
    setPrompt(prev => {
        const trimmed = prev.trim();
        if (trimmed.length === 0) return token;
        if (trimmed.toLowerCase().includes(token.toLowerCase())) return prev; 
        return `${trimmed}, ${token}`;
    });
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
  
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    const originalName = originalImage?.name.split('.').slice(0, -1).join('.') || 'image';
    link.download = `${originalName}-edited.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const originalImageSrc = useMemo(() => {
    if (!originalImage) return null;
    return `data:${originalImage.mimeType};base64,${originalImage.base64}`;
  }, [originalImage]);


  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-100 tracking-tight">
          Stone Image
        </h1>
        <p className="mt-4 text-lg text-stone-400 max-w-3xl mx-auto">
          Sculptez vos images avec la puissance de l'IA. Décrivez votre vision et regardez-la prendre forme.
        </p>
      </header>

      {/* Largeur augmentée à max-w-7xl pour un meilleur confort sur PC */}
      <main className="w-full max-w-7xl flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 mb-32">
        {/* Source Image Section */}
        <div className="flex flex-col gap-4">
          <div 
            className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all duration-300 aspect-square sm:aspect-[4/3] bg-stone-900/50 ${isDragging ? 'border-blue-500 bg-stone-900' : 'border-stone-700 hover:border-stone-600'}`}
            onDragOver={(e) => handleDragEvent(e, true)}
            onDragLeave={(e) => handleDragEvent(e, false)}
            onDrop={handleDrop}
          >
            {originalImageSrc ? (
              <>
                <img src={originalImageSrc} alt="Original" className="w-full h-full object-contain rounded-lg" />
                <button 
                  onClick={() => setOriginalImage(null)}
                  className="absolute top-2 right-2 bg-stone-800/80 p-2 rounded-full text-stone-400 hover:text-white transition-colors border border-stone-600/50"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="text-center p-6">
                <UploadIcon className="w-16 h-16 mx-auto text-stone-600 mb-4" />
                <p className="text-lg font-medium text-stone-300">Glissez-déposez une image ici</p>
                <p className="text-stone-500 my-2">ou</p>
                <label htmlFor="file-upload" className="inline-block bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold py-2 px-6 rounded-full cursor-pointer transition-colors border border-stone-600 shadow-lg">
                  Parcourir les fichiers
                </label>
                <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={onFileInputChange} />
              </div>
            )}
          </div>
        </div>

        {/* Result Image Section */}
        <div className="flex flex-col gap-4">
          <div className="relative flex flex-col items-center justify-center p-4 border-2 border-solid border-stone-800 rounded-2xl bg-stone-900 aspect-square sm:aspect-[4/3] overflow-hidden shadow-2xl shadow-black/50">
            {isLoading && !editedImage && (
               <div className="text-center flex flex-col items-center z-10">
                  <LoadingSpinnerIcon className="w-12 h-12 text-blue-500 mb-4" />
                  <p className="text-lg animate-pulse text-stone-300 font-medium">Transformation en cours...</p>
                  <p className="text-sm text-stone-500 mt-2">L'IA sculpte votre image pixel par pixel</p>
               </div>
            )}
            
            {error && (
              <div className="text-center text-red-400 p-6 bg-red-950/30 rounded-xl border border-red-900/50 max-w-md backdrop-blur-sm z-10">
                <p className="font-bold mb-1">Une erreur est survenue</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            )}
            
            {/* Display Edited or Comparison */}
            {(editedImage || (isLoading && editedImage)) && (
              <div className="relative w-full h-full flex items-center justify-center group">
                 <img 
                   src={showOriginal && originalImageSrc ? originalImageSrc : editedImage!} 
                   alt="Result" 
                   className="w-full h-full object-contain rounded-lg transition-opacity duration-300" 
                 />
                 
                 {/* Comparison Badge */}
                 {showOriginal && (
                   <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/10 pointer-events-none">
                     Original
                   </div>
                 )}
                 
                 {/* Actions Overlay */}
                 {!isLoading && (
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       <button
                         onMouseDown={() => setShowOriginal(true)}
                         onMouseUp={() => setShowOriginal(false)}
                         onMouseLeave={() => setShowOriginal(false)}
                         onTouchStart={() => setShowOriginal(true)}
                         onTouchEnd={() => setShowOriginal(false)}
                         className="bg-stone-800/80 backdrop-blur-md p-3 rounded-full text-white hover:bg-stone-700 border border-stone-600 transition-all active:scale-95 shadow-lg"
                         title="Maintenir pour voir l'original"
                       >
                         <EyeIcon className="w-5 h-5" />
                       </button>
                       <button
                         onClick={handleDownload}
                         className="bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-full text-white hover:bg-blue-500 border border-blue-400/30 transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex items-center gap-2 font-semibold text-sm"
                         title="Télécharger l'image"
                       >
                         <DownloadIcon className="w-5 h-5" />
                         <span>Télécharger</span>
                       </button>
                    </div>
                 )}
              </div>
            )}

            {!isLoading && !error && !editedImage && (
              <div className="text-center p-6 opacity-40">
                <SparklesIcon className="w-24 h-24 mx-auto text-stone-700 mb-4" />
                <p className="text-xl text-stone-400 font-light">Votre création apparaîtra ici</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-5xl bg-stone-900/95 backdrop-blur-2xl border border-stone-700/50 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-4 pointer-events-auto transition-all transform hover:translate-y-[-2px] hover:shadow-[0_10px_50px_-12px_rgba(0,0,0,0.6)]">
          
          {/* Presets and Enhancements */}
          <div className="flex flex-col gap-3 mb-3">
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                <div className="flex items-center gap-1 text-xs font-bold text-stone-500 uppercase mr-2 flex-shrink-0 select-none">
                  <WandIcon className="w-4 h-4" /> Styles
                </div>
                {STYLE_PRESETS.map(style => (
                  <button 
                    key={style} 
                    onClick={() => addPromptToken(style)}
                    disabled={!originalImage || isLoading}
                    className="flex-shrink-0 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 hover:text-white text-stone-300 text-xs sm:text-sm rounded-full border border-stone-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap active:bg-stone-600"
                  >
                    {style}
                  </button>
                ))}
             </div>
             
             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                <div className="flex items-center gap-1 text-xs font-bold text-stone-500 uppercase mr-2 flex-shrink-0 select-none">
                  <SparklesIcon className="w-4 h-4" /> Outils
                </div>
                {ENHANCEMENTS.map(item => (
                  <button 
                    key={item} 
                    onClick={() => addPromptToken(item)}
                    disabled={!originalImage || isLoading}
                    className="flex-shrink-0 px-3 py-1.5 bg-stone-800/40 hover:bg-stone-700/60 text-stone-400 hover:text-stone-200 text-xs sm:text-sm rounded-full border border-stone-800 border-dashed transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap active:bg-stone-700/80"
                  >
                    {item}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="relative flex-grow group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={originalImage ? "Décrivez les changements souhaités (ex: Transformer le chat en robot cyberpunk)..." : "Veuillez d'abord télécharger une image"}
                className="w-full bg-stone-950/80 border border-stone-700 rounded-xl p-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all resize-none text-stone-100 placeholder-stone-600 h-14 py-4 leading-relaxed shadow-inner"
                disabled={!originalImage || isLoading}
              />
              {prompt && (
                <button 
                  onClick={() => setPrompt('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-300 p-1 bg-stone-900/50 rounded-full hover:bg-stone-800 transition-colors"
                  title="Effacer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!originalImage || !prompt || isLoading}
              className="h-14 px-8 font-bold bg-stone-100 text-stone-950 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-white/5 flex items-center gap-2 border border-transparent hover:border-blue-300"
            >
              {isLoading ? (
                <LoadingSpinnerIcon className="w-5 h-5" />
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Générer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;