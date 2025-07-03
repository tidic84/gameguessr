/**
 * Script pour créer des images panoramiques de test
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'pano-samples');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Dossier créé: ${OUTPUT_DIR}`);
}

// Couleurs pour les différentes images
const COLORS = [
  { r: 255, g: 0, b: 0 },      // Rouge
  { r: 0, g: 255, b: 0 },      // Vert
  { r: 0, g: 0, b: 255 },      // Bleu
  { r: 255, g: 255, b: 0 },    // Jaune
  { r: 0, g: 255, b: 255 }     // Cyan
];

// Fonction pour créer une image de test
async function createTestImage(color, filename, width = 2000, height = 1000) {
  const outputPath = path.join(OUTPUT_DIR, filename);
  
  try {
    console.log(`Création de l'image: ${outputPath}`);
    
    // Créer une image de couleur unie
    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: color
      }
    })
    .jpeg({ quality: 90 })
    .toFile(outputPath);
    
    console.log(`Image créée: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la création de ${filename}:`, error);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('Création des images panoramiques de test...');
    
    const results = [];
    for (let i = 0; i < COLORS.length; i++) {
      const filename = `panorama-test-${i + 1}.jpg`;
      results.push(await createTestImage(COLORS[i], filename));
    }
    
    // Afficher le résumé
    const successCount = results.filter(Boolean).length;
    console.log(`\nProcessus terminé: ${successCount}/${COLORS.length} images créées avec succès.`);
    
  } catch (error) {
    console.error('Erreur dans le processus principal:', error);
  }
}

// Exécuter le script
main();
