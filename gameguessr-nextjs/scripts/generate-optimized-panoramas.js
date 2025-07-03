/**
 * Script pour générer automatiquement des versions optimisées des images panoramiques
 * - Crée des versions basse et moyenne résolution
 * - Convertit en formats modernes (WebP, AVIF)
 * - Organise dans une structure de dossiers adaptée
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

// Configuration
const INPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'pano-samples');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'panoramas');
const QUALITY_LEVELS = {
  low: { width: 1024, quality: 60 },
  medium: { width: 2048, quality: 75 },
  high: { width: null, quality: 85 } // La taille originale sera conservée
};
const FORMATS = ['jpg', 'webp', 'avif'];

// Créer les dossiers de sortie s'ils n'existent pas
function createOutputDirectories() {
  // Dossier principal
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Sous-dossiers pour chaque niveau de qualité
  Object.keys(QUALITY_LEVELS).forEach(quality => {
    if (quality !== 'high') { // Le niveau 'high' reste dans le dossier principal
      const qualityDir = path.join(OUTPUT_DIR, quality);
      if (!fs.existsSync(qualityDir)) {
        fs.mkdirSync(qualityDir, { recursive: true });
      }
    }
  });
}

// Traiter une image avec Sharp pour créer les différentes versions
async function processImage(inputPath, fileName) {
  console.log(`Traitement de l'image: ${fileName}`);
  
  try {
    // Charger l'image originale
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Générer les différentes versions pour chaque niveau de qualité
    for (const [quality, settings] of Object.entries(QUALITY_LEVELS)) {
      // Déterminer la taille de sortie
      const width = settings.width || metadata.width;
      const resizeOptions = {
        width,
        fit: 'inside',
        withoutEnlargement: true
      };
      
      // Générer pour chaque format
      for (const format of FORMATS) {
        // Déterminer le chemin de sortie
        let outputFileName;
        let outputPath;
        
        if (quality === 'high') {
          // Le niveau 'high' va dans le dossier principal avec le nom original
          outputFileName = `${path.parse(fileName).name}.${format}`;
          outputPath = path.join(OUTPUT_DIR, outputFileName);
        } else {
          // Les autres niveaux vont dans des sous-dossiers avec un suffixe de qualité
          outputFileName = `${path.parse(fileName).name}_${quality}.${format}`;
          outputPath = path.join(OUTPUT_DIR, quality, outputFileName);
        }
        
        // Créer la version redimensionnée et convertie
        console.log(`Création de: ${outputPath}`);
        
        let pipeline = image.clone().resize(resizeOptions);
        
        // Appliquer les options spécifiques au format
        if (format === 'jpg') {
          pipeline = pipeline.jpeg({ quality: settings.quality, progressive: true });
        } else if (format === 'webp') {
          pipeline = pipeline.webp({ quality: settings.quality });
        } else if (format === 'avif') {
          pipeline = pipeline.avif({ quality: settings.quality });
        }
        
        // Sauvegarder l'image
        await pipeline.toFile(outputPath);
      }
    }
    
    console.log(`Traitement terminé pour: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors du traitement de ${fileName}:`, error);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('Création des dossiers de sortie...');
    createOutputDirectories();
    
    // Trouver toutes les images panoramiques dans le dossier d'entrée
    const pattern = path.join(INPUT_DIR, '*.{jpg,jpeg,png}');
    console.log(`Recherche d'images avec le pattern: ${pattern}`);
    
    const files = glob.sync(pattern);
    console.log(`${files.length} images trouvées.`);
    
    // Afficher la liste des images trouvées
    console.log("Images trouvées :", files.map(f => path.basename(f)));
    
    // Traiter chaque image
    const results = [];
    for (const file of files) {
      const fileName = path.basename(file);
      results.push(await processImage(file, fileName));
    }
    
    // Afficher le résumé
    const successCount = results.filter(Boolean).length;
    console.log(`\nProcessus terminé: ${successCount}/${files.length} images traitées avec succès.`);
    
  } catch (error) {
    console.error('Erreur dans le processus principal:', error);
  }
}

// Exécuter le script
main();
