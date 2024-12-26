import React, { useState, useRef } from 'react';
import { CameraIcon, PhotoIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const RecipeScanner = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        processImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      // TODO: Implement image processing with backend API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="/images/splash-peppers.jpg"
          alt="Dynamic ingredients"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Scan Your Ingredients
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Take a photo or upload an image of your ingredients to discover delicious recipes you can make right now
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {image ? (
            <div className="relative rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm p-4">
              <img
                src={image}
                alt="Uploaded ingredients"
                className="w-full rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
                {isProcessing ? (
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                    <p className="text-xl">Analyzing your ingredients...</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setImage(null)}
                    className="text-white bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    Clear Image
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-8 text-white">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center space-x-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-8 rounded-xl transition-all duration-200 group"
                  >
                    <PhotoIcon className="h-8 w-8" />
                    <span className="text-lg">Upload Photo</span>
                  </button>
                  <button
                    className="flex items-center justify-center space-x-3 bg-accent-warm/90 hover:bg-accent-warm backdrop-blur-sm px-6 py-8 rounded-xl transition-all duration-200 group"
                  >
                    <CameraIcon className="h-8 w-8" />
                    <span className="text-lg">Take Photo</span>
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Supported ingredients</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Vegetables', 'Fruits', 'Meat', 'Seafood', 'Pantry Items'].map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full text-sm bg-white/10 text-gray-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Example Results Preview */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm group hover:scale-105 transition-transform duration-300">
              <img
                src="/images/grilled-meat.jpg"
                alt="Grilled meat recipe"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-white text-lg font-semibold mb-2">Grilled Herb-Crusted Steak</h3>
                <p className="text-gray-300 text-sm">Perfect match for your ingredients</p>
              </div>
            </div>
            {/* Add more recipe previews here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeScanner;
