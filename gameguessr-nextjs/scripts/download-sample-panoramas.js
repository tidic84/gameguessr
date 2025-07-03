/**
 * Script pour télécharger des images panoramiques d'exemple
 * pour tester l'optimisation des images
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'pano-samples');
const SAMPLE_URLS = [
  {
    url: 'https://images.unsplash.com/photo-1488464435123-c03dcc1a3492?auto=format&fit=crop&w=4000&q=80',
    filename: 'street-panorama-1.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=4000&q=80',
    filename: 'street-panorama-2.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1591384083254-9d4c7820d475?auto=format&fit=crop&w=4000&q=80',
    filename: 'forest-panorama-1.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1505245208761-ba872912fac0?auto=format&fit=crop&w=4000&q=80',
    filename: 'mountain-panorama-1.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=4000&q=80',
    filename: 'beach-panorama-1.jpg'
  }
];

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Dossier créé: ${OUTPUT_DIR}`);
}

// Fonction pour télécharger une image
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Téléchargement de: ${url}`);
    
    https.get(url, (response) => {
      // Gérer les redirections
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirection vers: ${redirectUrl}`);
        return downloadImage(redirectUrl, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      // Vérifier si la réponse est valide
      if (response.statusCode !== 200) {
        return reject(new Error(`Erreur de téléchargement: ${response.statusCode}`));
      }
      
      // Créer le flux de sortie
      const fileStream = fs.createWriteStream(outputPath);
      
      // Brancher les flux
      response.pipe(fileStream);
      
      // Gérer les événements
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Image téléchargée: ${outputPath}`);
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Nettoyer le fichier partiel
        reject(err);
      });
      
      response.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Nettoyer le fichier partiel
        reject(err);
      });
    }).on('error', reject);
  });
}

// Fonction principale
async function main() {
  try {
    console.log('Début du téléchargement des images panoramiques d\'exemple...');
    
    for (const sample of SAMPLE_URLS) {
      const outputPath = path.join(OUTPUT_DIR, sample.filename);
      await downloadImage(sample.url, outputPath);
    }
    
    console.log('Téléchargement terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors du téléchargement des images:', error);
  }
}

// Exécuter le script
main();
