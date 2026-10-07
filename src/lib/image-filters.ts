import { FilterType } from "@/types/scanner";

/**
 * Process an image Data URL with specified filter and rotation angle
 */
export async function processImage(
  dataUrl: string,
  filter: FilterType = 'magic',
  rotation: number = 0
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2d canvas context"));
          return;
        }

        // Account for rotation swapping width and height
        const isRotated = (rotation / 90) % 2 !== 0;
        const width = isRotated ? img.height : img.width;
        const height = isRotated ? img.width : img.height;

        canvas.width = width;
        canvas.height = height;

        // Apply rotation transformation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Apply canvas pixel filter if not original
        if (filter !== "original") {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          if (filter === "magic") {
            // Magic Document Mode: Boost contrast, lighten whites, darken text
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Luminance
              let gray = 0.299 * r + 0.587 * g + 0.114 * b;

              // Soft thresholding / magic contrast curve
              // Light areas become pure white, dark areas become bold black
              if (gray > 175) {
                gray = 255;
              } else if (gray < 75) {
                gray = Math.max(0, gray * 0.4);
              } else {
                // S-curve boost for midtones
                gray = (gray - 75) * (255 / 100);
                gray = Math.min(255, Math.max(0, gray));
              }

              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);

          } else if (filter === "bw") {
            // Strict B&W Threshold
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              const val = gray > 140 ? 255 : 0;
              data[i] = val;
              data[i + 1] = val;
              data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

          } else if (filter === "grayscale") {
            // Standard Grayscale
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);

          } else if (filter === "contrast") {
            // Contrast boost
            const factor = (259 * (128 + 255)) / (255 * (259 - 128));
            for (let i = 0; i < data.length; i += 4) {
              data[i] = factor * (data[i] - 128) + 128;
              data[i + 1] = factor * (data[i + 1] - 128) + 128;
              data[i + 2] = factor * (data[i + 2] - 128) + 128;
            }
            ctx.putImageData(imageData, 0, 0);
          }
        }

        const resultDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        resolve({
          dataUrl: resultDataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}
