import { MachineTechnology } from '@prisma/client';

export interface AuditParameters {
  packagingSubstrate: string;
  unitsPerHour?: number | null;
  lineSpeedMpm?: number | null;
  dustLevel?: string | null;
  washdownExposure?: boolean;
  messageLinesCount?: number;
  ambientTempMin?: number | null;
  ambientTempMax?: number | null;
}

export interface RecommendationResult {
  recommendedTech: MachineTechnology;
  modelNumber: string;
  confidenceScore: number;
  justification: string;
  suggestedConsumable: string;
  assumptions: string;
  missingDataNotes: string;
}

export function generateTechnicalRecommendation(params: AuditParameters): RecommendationResult {
  const substrate = (params.packagingSubstrate || '').toLowerCase();
  const dust = (params.dustLevel || '').toLowerCase();
  const isWashdown = params.washdownExposure ?? false;
  const speed = params.unitsPerHour ?? 10000;
  const lines = params.messageLinesCount ?? 2;

  // 1. Thermal Transfer Overprinter (TTO) - Flexible packaging / films / pouches
  if (substrate.includes('film') || substrate.includes('opercule') || substrate.includes('sachet') || substrate.includes('flowpack')) {
    return {
      recommendedTech: MachineTechnology.TTO,
      modelNumber: '6530',
      confidenceScore: 94.0,
      justification: 'Pour les films souples et emballages flexibles, le transfert thermique Videojet DataFlex 6530 offre une impression haute résolution 300 dpi sans solvant, avec cassette ruban étanche IP65 et mécanisme iAssure™ breveté de détection automatique des défauts de marquage.',
      suggestedConsumable: 'Ruban transfert thermique Videojet résine Ultra Black 33mm x 1000m.',
      assumptions: 'Machine de conditionnement type ensacheuse verticale (VFFS) ou horizontale (HFFS) avec support de montage adapté.',
      missingDataNotes: 'Préciser si le mouvement du film est intermittent ou continu pour dimensionner l\'encodeur.',
    };
  }

  // 2. Thermal Inkjet (TIJ) - Pharmaceutical Cartons / 2D Datamatrix
  if (substrate.includes('étui') || substrate.includes('blister') || substrate.includes('pharma') || (substrate.includes('carton') && lines >= 3)) {
    return {
      recommendedTech: MachineTechnology.TIJ,
      modelNumber: 'Wolke m610',
      confidenceScore: 96.0,
      justification: 'Le système jet d\'encre thermique Wolke m610 advanced est la référence mondiale de la sérialisation pharmaceutique. Résolution native jusqu\'à 600 dpi, cartouches propres HP sans maintenance complexe, conforme aux exigences 21 CFR Part 11.',
      suggestedConsumable: 'Cartouche d\'encre solvantée Wolke TIJ noire séchage instantané sur vernis aqueux.',
      assumptions: 'Guidage précis des étuis avec écartement constant inférieur à 2 mm devant la cartouche.',
      missingDataNotes: 'Vérifier la présence d\'un système de rejet automatique aval en cas de code non lisible.',
    };
  }

  // 3. Laser CO2 - Permanent indelible mark on cartons, PET or glass without consumables
  if (substrate.includes('verre') && !isWashdown && speed <= 30000) {
    return {
      recommendedTech: MachineTechnology.LASER_CO2,
      modelNumber: '3340',
      confidenceScore: 91.5,
      justification: 'Le laser CO2 Videojet 3340 (30 Watts) grave le verre ou le carton de manière indélébile et inviolable sans aucun consommable (encre ni solvant). Tête articulée 32 points d\'orientation pour intégration compacte.',
      suggestedConsumable: 'Aucun consommable requis. Prévoir filtre d\'extraction de fumées Videojet X-Extract.',
      assumptions: 'Installation d\'un carénage de sécurité optique laser Classe 1 selon la norme marocaine NM ISO 11553.',
      missingDataNotes: 'Faire tester un échantillon du verre en laboratoire Videojet pour valider le contraste et la longueur d\'onde optimale (9.3 µm vs 10.6 µm).',
    };
  }

  // 4. Heavy-duty CIJ - Washdown environment, dust, high cadence (Videojet 1880 MAXIMiZE)
  if (isWashdown || dust.includes('sévère') || dust.includes('modéré') || speed > 25000) {
    return {
      recommendedTech: MachineTechnology.CIJ,
      modelNumber: '1880',
      confidenceScore: 97.5,
      justification: 'La Videojet 1880 MAXIMiZE™ est conçue pour les lignes industrielles intensives et exigeantes. Châssis inox 316 indice IP66 lavable sans démontage, buse CleanFlow™ à débit d\'air continu anti-encrassement, capteur prédictif Smart Cell™ et connectivité VideojetConnect™ intégrée.',
      suggestedConsumable: 'Encre Videojet V411-D MEK Noire adhésion renforcée humidité/froid + Solvant make-up V706-D.',
      assumptions: 'Lavage quotidien de la ligne au jet basse pression; air comprimé usine sec et déshuilé disponible.',
      missingDataNotes: 'Vérifier le débit et la pression de l\'alimentation d\'air comprimé de l\'usine.',
    };
  }

  // 5. Standard CIJ (Videojet 1580) - General versatile coding
  return {
    recommendedTech: MachineTechnology.CIJ,
    modelNumber: '1580',
    confidenceScore: 90.0,
    justification: 'La Videojet 1580 offre un équilibre parfait entre cadence élevée, simplicité d\'exploitation et coût maîtrisé. Système OPTIMiZE réduisant les interventions opérateurs, interface tactile SIMPLICiTY™ et réserve de solvant évitant tout arrêt pendant le rechargement.',
    suggestedConsumable: 'Encre Videojet V410-D base MEK séchage universel + Solvant V705-D.',
    assumptions: 'Ligne de production sous abri en ambiance tempérée (5°C à 40°C).',
    missingDataNotes: 'Confirmer la distance convoyeur disponible pour le montage du support de tête.',
  };
}
