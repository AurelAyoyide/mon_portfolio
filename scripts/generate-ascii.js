const asciify = require('asciify-image');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const imagePath = path.join(__dirname, '../public/image/aurel.png');
const outputPath = path.join(__dirname, '../app/ascii-avatar.ts');

// Alphabet avec plus de nuances (du plus clair au plus foncé)
const ASCII_CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

async function imageToAscii(imagePath, width = 100) {  // Réduit à 100 pour meilleure lisibilité
  const img = await loadImage(imagePath);
  
  // Calculer la hauteur pour garder le ratio (1.8 pour éviter l'aplatissement)
  const height = Math.floor((width * img.height) / (img.width * 1.8)); // 1.8 car les chars sont plus hauts que larges
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Dessiner l'image redimensionnée
  ctx.drawImage(img, 0, 0, width, height);
  
  // Obtenir les pixels
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  let asciiLines = [];
  let colorLines = [];
  
  for (let y = 0; y < height; y++) {
    let line = '';
    let colorLine = [];
    
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      
      // Calculer la luminosité
      const brightness = (r + g + b) / 3;
      
      // Mapper la luminosité à un caractère
      const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
      line += ASCII_CHARS[charIndex];
      
      // Stocker la couleur RGB
      colorLine.push(`rgb(${r},${g},${b})`);
    }
    
    asciiLines.push(line);
    colorLines.push(colorLine);
  }
  
  return { asciiLines, colorLines };
}

imageToAscii(imagePath, 150)  // Largeur optimale pour performance et qualité
  .then(({ asciiLines, colorLines }) => {
    console.log('ASCII Art généré avec succès!');
    console.log(asciiLines.join('\n'));
    
    // Créer un module TypeScript exportable avec tableau et couleurs
    const tsContent = `// Auto-generated ASCII art with colors
export const ASCII_AVATAR = ${JSON.stringify(asciiLines, null, 2)}.join('\\n');

export const ASCII_COLORS = ${JSON.stringify(colorLines, null, 2)};
`;
    
    fs.writeFileSync(outputPath, tsContent);
    console.log(`\nSauvegardé dans: ${outputPath}`);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
