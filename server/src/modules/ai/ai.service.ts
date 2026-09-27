import axios from 'axios';

export interface DiagnosticInput {
  model: string;
  errorCode?: string;
  symptoms: string;
  lineContext?: string;
}

export interface DiagnosticResult {
  title: string;
  severity: 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'FAIBLE';
  estimatedDowntimeMin: number;
  probableCauses: string[];
  actionSteps: { step: number; action: string; precaution?: string }[];
  requiredParts: { partNumber: string; name: string; quantity: number }[];
  safetyWarnings: string[];
  preventiveAdvice: string;
}

export interface InkAdvisorInput {
  substrate: string;
  lineSpeed?: number;
  temperature?: string;
  humidity?: string;
  foodContact?: boolean;
  industry?: string;
}

export interface InkAdvisorResult {
  recommendedTechnology: string;
  primaryInk: {
    partNumber: string;
    name: string;
    chemistry: string;
    dryingTimeSeconds: number;
    color: string;
    features: string[];
  };
  associatedMakeUp?: {
    partNumber: string;
    name: string;
    consumptionRatio: string;
  };
  alternativeOptions: {
    partNumber: string;
    name: string;
    justification: string;
  }[];
  regulatoryCompliance: string[];
}

export interface SalesPitchInput {
  competitor: string;
  targetIndustry: string;
  clientConcerns?: string;
  budgetSensitivity?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SalesPitchResult {
  targetCompetitor: string;
  executivePitch: string;
  keyDifferentiators: { feature: string; videojetAdvantage: string; competitorWeakness: string }[];
  objectionHandling: { objection: string; counterArgument: string }[];
  tcoImpact: string;
  recommendedProofOfConcept: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ==============================================================================
// 1. EMBEDDED VIDEOJET INDUSTRIAL KNOWLEDGE BASE
// ==============================================================================

const ERROR_KNOWLEDGE_BASE: Record<string, Partial<DiagnosticResult>> = {
  // CIJ Errors
  E52: {
    title: 'Défaut de Viscosité Encre — Circuit Hydraulique CIJ',
    severity: 'HAUTE',
    estimatedDowntimeMin: 20,
    probableCauses: [
      'Niveau de solvant (make-up) épuisé ou cartouche non détectée par la puce Smart Cartridge™.',
      'Sonde de viscosité / capteur thermique du réservoir Smart Cell™ encrassé.',
      'Encre périmée ou émulsion suite à un arrêt prolongé en atmosphère humide.',
    ],
    actionSteps: [
      {
        step: 1,
        action: 'Vérifier la présence et le niveau de la cartouche de solvant Make-up Videojet V706-D.',
        precaution: 'Ne jamais forcer une cartouche non reconnue par le détrompeur électronique.',
      },
      {
        step: 2,
        action: 'Lancer un cycle de dosage forcé de solvant depuis l\'écran tactile SIMPLICiTY (Menu Diagnostics > Fluides > Dosage Make-up).',
      },
      {
        step: 3,
        action: 'Observer la valeur de viscosité mesurée : la plage nominale doit être comprise entre 2.4 et 3.1 mPa.s.',
      },
      {
        step: 4,
        action: 'Si le défaut persiste après 15 minutes de dosage, inspecter la crépine du réservoir et planifier le remplacement du filtre Smart Cell.',
      },
    ],
    requiredParts: [
      { partNumber: 'V706-D', name: 'Solvant Make-Up Videojet V706-D (Cartouche 750ml)', quantity: 1 },
      { partNumber: '611180', name: 'Module Filtre Principal Smart Cell™ CIJ 1580/1880', quantity: 1 },
    ],
    safetyWarnings: [
      'Port obligatoire des gants nitrile et lunettes de protection pour manipulation de solvants MEK inflammables.',
      'Manipuler à l\'écart de toute source d\'étincelle ou de flamme.',
    ],
    preventiveAdvice: 'Toujours maintenir au moins une cartouche de Make-up V706-D d\'avance en stock pour éviter le blocage de ligne.',
  },

  FA10: {
    title: 'Défaut Gouttière de Récupération (Gutter Fault) — Tête d\'Impression CIJ',
    severity: 'CRITIQUE',
    estimatedDowntimeMin: 15,
    probableCauses: [
      'Buse d\'éjection 60/70 microns partiellement bouchée provoquant une déviation du jet.',
      'Présence d\'un dépôt d\'encre séchée sur les électrodes de déflexion haute tension.',
      'Gouttière de reprise d\'encre mal alignée ou dépression d\'aspiration insuffisante.',
    ],
    actionSteps: [
      {
        step: 1,
        action: 'Stopper le jet et ouvrir le capot de la tête d\'impression.',
        precaution: 'Attention à la haute tension (plusieurs kV sur les plaques de déflexion). Couper la HT avant manipulation.',
      },
      {
        step: 2,
        action: 'Rincer abondamment la buse et les plaques de charge avec la pissette de solvant de nettoyage Videojet V901.',
      },
      {
        step: 3,
        action: 'Activer la fonction exclusive CleanFlow™ de purge et séchage automatique de buse.',
      },
      {
        step: 4,
        action: 'Redémarrer le jet et observer à la loupe stroboscopique que le filet d\'encre plonge exactement au centre du trou de la gouttière.',
      },
    ],
    requiredParts: [
      { partNumber: 'V901-Q', name: 'Solvant de Lavage & Rinçage Tête Videojet V901 (Flacon 1L)', quantity: 1 },
      { partNumber: '399120', name: 'Kit Joints d\'Étanchéité Tête CleanFlow™', quantity: 1 },
    ],
    safetyWarnings: [
      'Ne jamais utiliser d\'aiguille ou d\'objet métallique pour déboucher la buse sous peine de rayer l\'orifice calibré.',
    ],
    preventiveAdvice: 'Effectuer un nettoyage hebdomadaire CleanFlow avant l\'arrêt du week-end pour garantir un démarrage à froid immédiat le lundi matin.',
  },

  SHUTTER_FAULT: {
    title: 'Défaut Obturateur Laser / Interlock Sécurité (Laser 3340 / 3640)',
    severity: 'CRITIQUE',
    estimatedDowntimeMin: 25,
    probableCauses: [
      'Boucle de sécurité capot (Interlock 24V DC) ouverte sur la ligne de conditionnement.',
      'Obturateur optique galvanométrique bloqué par accumulation de poussières de carton.',
      'Relais de sécurité interne de la source laser défectueux.',
    ],
    actionSteps: [
      {
        step: 1,
        action: 'Vérifier la fermeture complète du capot de protection en Makrolon / Lexan de la zone laser.',
      },
      {
        step: 2,
        action: 'Mesurer la tension 24V sur les bornes du connecteur de sécurité externe à l\'arrière du contrôleur laser.',
      },
      {
        step: 3,
        action: 'Vérifier l\'état du voyant de l\'obturateur sur la tête laser : le volet doit claquer distinctement à l\'armement.',
      },
      {
        step: 4,
        action: 'Nettoyer la lentille de focalisation avec une lingette optique imprégnée d\'alcool isopropylique pur.',
      },
    ],
    requiredParts: [
      { partNumber: '403810', name: 'Module Contacteur Interlock Sécurité Laser Videojet', quantity: 1 },
      { partNumber: 'OPT-CLEAN-KIT', name: 'Kit de Nettoyage Spécial Optique Laser CO2', quantity: 1 },
    ],
    safetyWarnings: [
      'RAYONNEMENT LASER CLASSE 4 INVISIBLE (10.6 µm) : Port impératif de lunettes certifiées EN 207 adaptées à la longueur d\'onde CO2.',
    ],
    preventiveAdvice: 'Vérifier l\'aspiration des fumées de gravure pour éviter que les poussières n\'atteignent les miroirs galvos.',
  },

  RIBBON_BREAK: {
    title: 'Rupture de Ruban Transfert Thermique (TTO DataFlex 6330 / 6530)',
    severity: 'MOYENNE',
    estimatedDowntimeMin: 10,
    probableCauses: [
      'Tension de ruban mal calibrée sur le mandrin dévideur motorisé.',
      'Arête coupante ou surchauffe excessive de la tête thermique 300 DPI.',
      'Qualité de ruban inadaptée à la vitesse d\'accélération de l\'ensacheuse.',
    ],
    actionSteps: [
      {
        step: 1,
        action: 'Retirer la cassette de ruban et recoller les deux extrémités avec un adhésif de raccordement.',
      },
      {
        step: 2,
        action: 'Nettoyer la ligne de chauffe de la tête thermique avec un bâtonnet d\'alcool isopropylique.',
      },
      {
        step: 3,
        action: 'Vérifier dans les paramètres du contrôleur CLARiTY que la technologie sans embrayage motorisée est activée.',
      },
      {
        step: 4,
        action: 'Abaisser l\'énergie d\'impression de 5% si le ruban fond sous l\'effet d\'une surchauffe thermique.',
      },
    ],
    requiredParts: [
      { partNumber: '6530-RIB-55', name: 'Ruban Transfert Thermique Videojet Ultra Black 55mm x 1100m', quantity: 1 },
      { partNumber: '408540', name: 'Tête d\'Impression Thermique 53mm Kyocera 300 DPI', quantity: 1 },
    ],
    safetyWarnings: [
      'Ne pas toucher la tête thermique immédiatement après impression : risque de brûlure superficielle.',
    ],
    preventiveAdvice: 'Privilégier les rubans Videojet à longueur optimisée 1100m pour réduire les changements de bobines de 50%.',
  },
};

// ==============================================================================
// 2. DIAGNOSTIC SERVICE
// ==============================================================================

export const runDiagnostic = async (input: DiagnosticInput): Promise<DiagnosticResult> => {
  const code = input.errorCode?.toUpperCase().trim() || '';

  // 1. Check exact match in expert KB
  if (code && ERROR_KNOWLEDGE_BASE[code]) {
    const base = ERROR_KNOWLEDGE_BASE[code] as DiagnosticResult;
    return {
      ...base,
      preventiveAdvice: `${base.preventiveAdvice} — Recommandation spécifique pour le modèle ${input.model} installé sur votre ligne.`,
    };
  }

  // 2. Search by model and symptom keywords
  const symptoms = (input.symptoms + ' ' + (input.lineContext || '')).toLowerCase();

  if (symptoms.includes('viscosit') || symptoms.includes('solvant') || symptoms.includes('make-up')) {
    return ERROR_KNOWLEDGE_BASE['E52'] as DiagnosticResult;
  }
  if (symptoms.includes('gouttiere') || symptoms.includes('buse') || symptoms.includes('jet') || symptoms.includes('bouch')) {
    return ERROR_KNOWLEDGE_BASE['FA10'] as DiagnosticResult;
  }
  if (symptoms.includes('laser') || symptoms.includes('obturateur') || symptoms.includes('shutter') || symptoms.includes('lentille')) {
    return ERROR_KNOWLEDGE_BASE['SHUTTER_FAULT'] as DiagnosticResult;
  }
  if (symptoms.includes('ruban') || symptoms.includes('tto') || symptoms.includes('transfert') || symptoms.includes('cassette')) {
    return ERROR_KNOWLEDGE_BASE['RIBBON_BREAK'] as DiagnosticResult;
  }

  // 3. Fallback generic expert response
  return {
    title: `Diagnostic Technique Avancé — ${input.model} (${input.errorCode || 'Symptôme Inconnu'})`,
    severity: 'MOYENNE',
    estimatedDowntimeMin: 30,
    probableCauses: [
      `Dérive des paramètres de fonctionnement sur la machine ${input.model}.`,
      'Encrassement des organes d\'impression ou connecteurs de communication.',
      'Instabilité de l\'alimentation électrique ou signal cellule de détection produit.',
    ],
    actionSteps: [
      {
        step: 1,
        action: `Vérifier les voyants de diagnostic sur la face avant du contrôleur ${input.model}.`,
        precaution: 'Vérifier la mise à la terre correcte du châssis machine.',
      },
      {
        step: 2,
        action: 'Consulter le journal des événements système (Historique des alarmes) pour identifier le code déclencheur.',
      },
      {
        step: 3,
        action: 'Effectuer un redémarrage à froid (Cold Restart) en respectant la temporisation de vidange hydraulique (5 minutes).',
      },
      {
        step: 4,
        action: 'Si l\'anomalie persiste, contacter le Support SAV Videojet Maroc au +212 5 22 00 00 00 avec le N° de série.',
      },
    ],
    requiredParts: [
      { partNumber: 'GEN-MAINT-KIT', name: `Kit de Maintenance Préventive Annuelle ${input.model}`, quantity: 1 },
    ],
    safetyWarnings: [
      'Toute intervention dans les sous-ensembles électroniques doit être réalisée par un technicien habilité Videojet Maroc.',
    ],
    preventiveAdvice: 'Vérifier régulièrement l\'historique d\'intervention sur la vue Machine 360° pour anticiper les pannes répétitives.',
  };
};

// ==============================================================================
// 3. INK & CHEMISTRY ADVISOR SERVICE
// ==============================================================================

export const recommendInkAndSolvent = async (input: InkAdvisorInput): Promise<InkAdvisorResult> => {
  const sub = input.substrate.toLowerCase();

  // Substrate: Plastic PE / PP / Packaging with moisture
  if (sub.includes('pe') || sub.includes('poly') || sub.includes('bouteille') || sub.includes('huile') || sub.includes('gras') || sub.includes('froid')) {
    return {
      recommendedTechnology: 'Jet d\'Encre Continu (CIJ) — Videojet 1580 / 1880',
      primaryInk: {
        partNumber: 'V411-D',
        name: 'Encre Videojet V411-D Haute Adhérence',
        chemistry: 'Base MEK (Méthyl-Éthyl-Cétone) à pénétration rapide',
        dryingTimeSeconds: 0.8,
        color: 'Noir Intense',
        features: [
          'Excellente tenue sur polyéthylène (PEHD/PEBD) et polypropylène (PP).',
          'Résistance prouvée à la condensation d\'eau à 4°C et aux traces de corps gras.',
          'Homologuée pour lignes d\'embouteillage laitières et huiles végétales.',
        ],
      },
      associatedMakeUp: {
        partNumber: 'V706-D',
        name: 'Solvant de Compensation Videojet V706-D',
        consumptionRatio: '1 flacon d\'encre pour 3 à 4 flacons de make-up selon température atelier',
      },
      alternativeOptions: [
        {
          partNumber: 'V4210-D',
          name: 'Encre Sans MEK Éthanol / Propanol',
          justification: 'Alternative écologique et sans odeur pour ateliers cosmétiques stricts.',
        },
      ],
      regulatoryCompliance: [
        'Règlement Européen CE 1935/2004 (Contact alimentaire indirect)',
        'Conformité FDA 21 CFR',
        'Certification Halal & Kasher',
      ],
    };
  }

  // Substrate: Glass & beverage wash-off
  if (sub.includes('verre') || sub.includes('bouteille verre') || sub.includes('consign')) {
    return {
      recommendedTechnology: 'Jet d\'Encre Continu (CIJ) ou Laser CO2 3340',
      primaryInk: {
        partNumber: 'V420-D',
        name: 'Encre Videojet V420-D Lavable en Soude Caustique',
        chemistry: 'Base Éthanol / MEK spéciale lavage bouteilles consignées',
        dryingTimeSeconds: 1.2,
        color: 'Noir Foncé',
        features: [
          'Dissolution rapide et totale lors du bain de lavage en soude caustique à 2% à 65°C.',
          'Aucune bavure en sortie d\'embouteilleuse en ambiance saturée d\'humidité.',
        ],
      },
      associatedMakeUp: {
        partNumber: 'V708-D',
        name: 'Solvant de Remplacement V708-D',
        consumptionRatio: '1 pour 3.5',
      },
      alternativeOptions: [
        {
          partNumber: 'LASER-3340',
          name: 'Gravure Laser CO2 30W Directe Verre',
          justification: 'Élimine totalement les consommables pour gravure indélébile permanente.',
        },
      ],
      regulatoryCompliance: ['Normes brasseries et embouteilleurs de sodas'],
    };
  }

  // Substrate: Pharma Carton / Datamatrix
  if (sub.includes('carton') || sub.includes('pharma') || sub.includes('datamatrix') || sub.includes('boite')) {
    return {
      recommendedTechnology: 'Jet d\'Encre Thermique (TIJ) — Wolke m610 Touch',
      primaryInk: {
        partNumber: 'WLK660082A',
        name: 'Cartouche d\'Encre Wolke Premium Pharma Black',
        chemistry: 'Base aqueuse pigmentée haute densité optique',
        dryingTimeSeconds: 0.5,
        color: 'Noir Profond Mat',
        features: [
          'Lisibilité maximale certifiée Grade A sur les codes-barres 2D DataMatrix GS1.',
          'Zéro bavure sur carton couché et non couché.',
          'Cartouche jetable neuve intégrant tête d\'impression : maintenance nulle.',
        ],
      },
      alternativeOptions: [
        {
          partNumber: 'LASER-3340',
          name: 'Laser CO2 avec ablation de vernis carton',
          justification: 'Vitesse extrême jusqu\'à 2000 boîtes/min sans aucune cartouche.',
        },
      ],
      regulatoryCompliance: [
        'Directive Médicaments Falsifiés (FMD 2011/62/UE)',
        'FDA 21 CFR Part 11 (Audit Trail sérialisation)',
      ],
    };
  }

  // Substrate: Flexible film packaging / TTO
  return {
    recommendedTechnology: 'Transfert Thermique (TTO) — Videojet DataFlex 6530',
    primaryInk: {
      partNumber: '6530-RIB-ULTRA',
      name: 'Ruban Transfert Thermique Résine / Cire Ultra Grade',
      chemistry: 'Enduction résine haute adhérence pour films BOPP / PE / Métallisé',
      dryingTimeSeconds: 0.0,
      color: 'Noir Carbone',
      features: [
        'Séchage instantané mécanique (transfert thermique par pression).',
        'Résistance totale aux frottements dans les ensacheuses horizontales et verticales (VFFS/HFFS).',
        'Longueur 1100 mètres permettant de doubler le temps de production entre deux recharges.',
      ],
    },
    alternativeOptions: [
      {
        partNumber: 'CIJ-V411D',
        name: 'Jet d\'encre CIJ sans contact',
        justification: 'Pour lignes où la cadence dépasse 120 mètres/minute en continu.',
      },
    ],
    regulatoryCompliance: [
      'Règlement CE 1935/2004',
      'Sans solvant organique volatil (Zéro COV)',
    ],
  };
};

// ==============================================================================
// 4. SALES PITCH GENERATOR SERVICE
// ==============================================================================

export const generateSalesPitch = async (input: SalesPitchInput): Promise<SalesPitchResult> => {
  const comp = input.competitor.toUpperCase();

  if (comp.includes('MARKEM') || comp.includes('9450')) {
    return {
      targetCompetitor: 'Markem-Imaje (Gamme 9450 / 9040)',
      executivePitch: `Face à Markem-Imaje, notre positionnement repose sur l'élimination des arrêts non planifiés et la réduction drastique du coût de possession (TCO) grâce à la tête CleanFlow™ brevetée Videojet et au module V-Core sans maintenance.`,
      keyDifferentiators: [
        {
          feature: 'Autonomie de la Tête d\'Impression',
          videojetAdvantage: 'Tête CleanFlow™ brevetée avec flux d\'air pulsé interne : 0 nettoyage nécessaire pendant 3 semaines.',
          competitorWeakness: 'La tête Markem-Imaje nécessite un rinçage manuel fréquent provoquant des coulures sur ligne.',
        },
        {
          feature: 'Remplacement des Filtres & Maintenance',
          videojetAdvantage: 'Module Smart Cell™ / V-Core remplaçable en 5 minutes chrono par l\'opérateur sans technicien spécialisé.',
          competitorWeakness: 'Remplacement du bloc hydraulique Markem complexe nécessitant une intervention SAV facturée.',
        },
        {
          feature: 'Fiabilité Viscosité en Climat Chaud (Maroc)',
          videojetAdvantage: 'Technologie Dynamic Calibration™ qui ajuste en continu les paramètres selon les fortes chaleurs estivales.',
          competitorWeakness: 'Tendance aux dérives de viscosité et arrêts intempestifs au-delà de 35°C dans les usines marocaines.',
        },
      ],
      objectionHandling: [
        {
          objection: 'Markem-Imaje nous fait une remise agressive sur le prix d\'achat de la machine.',
          counterArgument: 'Le prix de la machine ne représente que 15% du coût réel sur 5 ans. Notre consommation de solvant est inférieure de 25% et nous garantissons zéro arrêt de tête, ce qui vous fait économiser plus de 45 000 MAD par an en consommables et arrêts.',
        },
        {
          objection: 'Nos opérateurs sont déjà formés sur l\'interface Markem-Imaje.',
          counterArgument: 'L\'interface SIMPLICiTY de Videojet est la seule conçue comme un smartphone, disponible nativement en français et en arabe avec tutoriels vidéo de 30 secondes intégrés à l\'écran. La prise en main prend moins de 15 minutes.',
        },
      ],
      tcoImpact: 'Économie annuelle moyenne mesurée chez nos clients agroalimentaires au Maroc : 32 000 MAD à 68 000 MAD / ligne.',
      recommendedProofOfConcept: 'Installation d\'une Videojet 1880 en prêt gratuit pendant 15 jours sur votre ligne la plus exigeante pour comparer les temps d\'arrêt en direct.',
    };
  }

  if (comp.includes('DOMINO') || comp.includes('AX')) {
    return {
      targetCompetitor: 'Domino Printing (Série Ax-Series / Ax150i / Ax350i)',
      executivePitch: `Contre Domino, nous mettons en avant la simplicité de gestion des cartouches Smart Cartridge™ antifuites et notre service après-vente basé à Casablanca avec un stock de pièces détachées immédiatement disponible en 4h au Maroc.`,
      keyDifferentiators: [
        {
          feature: 'Système de Fluides & Recharges',
          videojetAdvantage: 'Système Smart Cartridge™ à aiguille avec détrompeur RFID : aucune goutte gaspillée, zéro erreur de fluide possible.',
          competitorWeakness: 'Cartouches Domino sujettes aux coulures lors du retrait en fin de journée.',
        },
        {
          feature: 'Disponibilité Pièces & Réactivité SAV au Maroc',
          videojetAdvantage: 'Centre technique et magasin central à Casablanca avec techniciens certifiés mobiles sur tout le Royaume sous engagement SLA garanti.',
          competitorWeakness: 'Délais de réapprovisionnement parfois longs pour les pièces spécifiques soumises au dédouanement.',
        },
      ],
      objectionHandling: [
        {
          objection: 'Domino prétend avoir la consommation de fluide la plus basse.',
          counterArgument: 'Nos tests comparatifs réels sur lignes de boissons à Casablanca démontrent que le système de condensation de solvant de la Videojet 1880 atteint un ratio d\'évaporation minimal, réduisant l\'achat de make-up de 30% par rapport à l\'Ax350i.',
        },
      ],
      tcoImpact: 'Réduction de 20% des dépenses d\'entretien périodique grâce à la garantie 5 ans V-Core.',
      recommendedProofOfConcept: 'Audit comparatif de consommation de solvant sur 100 000 emballages marqués.',
    };
  }

  // Generic competitor pitch (Linx, Hitachi, Leibinger)
  return {
    targetCompetitor: `${input.competitor} (Constructeurs CIJ & Marquage Industriel)`,
    executivePitch: `Videojet est le leader mondial incontesté du marquage industriel avec plus de 400 000 machines installées dans le monde et un réseau d'ingénieurs SAV dédié au Maroc. Nous offrons la disponibilité maximale de ligne (Uptime Peace of Mind).`,
    keyDifferentiators: [
      {
        feature: 'Disponibilité & Uptime Ligne',
        videojetAdvantage: 'Conçue pour tourner 24h/24 en environnement industriel sévère avec garantie de disponibilité opérationnelle.',
        competitorWeakness: 'Sensibilité accrue aux fluctuations de température et aux poussières d\'usine.',
      },
      {
        feature: 'Connectivité & Industrie 4.0',
        videojetAdvantage: 'Suite logicielle VideojetConnect™ permettant le monitoring distant et la maintenance prédictive.',
        competitorWeakness: 'Systèmes fermés sans intégration ERP / MES moderne.',
      },
    ],
    objectionHandling: [
      {
        objection: 'Les machines Videojet sont réputées plus chères.',
        counterArgument: 'Le coût d\'un seul arrêt de ligne non planifié de 2 heures chez vous dépasse largement l\'écart de prix. Investir dans Videojet, c\'est acheter une assurance contre les pertes de cadence.',
      },
    ],
    tcoImpact: 'ROI atteint en moins de 14 mois grâce à la suppression des pannes critiques.',
    recommendedProofOfConcept: 'Essai comparatif en conditions réelles avec comptage automatisé des arrêts.',
  };
};

// ==============================================================================
// 5. CONVERSATIONAL INDUSTRIAL CHAT COPILOT
// ==============================================================================

export const chatWithCopilot = async (
  messages: ChatMessage[],
  userRole?: string
): Promise<string> => {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const lowerMsg = lastUserMessage.toLowerCase();

  // Try calling external LLM if configured
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Tu es l'Assistant IA Industriel expert de VIDEOJET MAROC INDUSTRIAL PLATFORM. Tu aides les techniciens SAV, commerciaux, magasiniers et directeurs d'usine au Maroc.
Tu connais parfaitement toutes les technologies Videojet (CIJ 1580/1880, Laser CO2 3340/3640, Laser Fibre 7340, TTO DataFlex 6330/6530, TIJ Wolke m610), les solvants V706-D, les encres V411-D, et les réglementations industrielles marocaines (ONSSA, agroalimentaire, pharma).
Réponds avec rigueur technique, clarté, étapes concrètes, références de pièces et bienveillance professionnelle en français.

Message de l'utilisateur : ${lastUserMessage}`,
                },
              ],
            },
          ],
        },
        { timeout: 8000 }
      );

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) return generatedText;
    } catch (err: any) {
      console.warn('[AI Service] Gemini API call failed or timed out, falling back to embedded expert KB:', err.message);
    }
  }

  // Embedded Semantic Fallback Engine
  if (lowerMsg.includes('e52') || lowerMsg.includes('viscosit')) {
    const diag = await runDiagnostic({ model: 'Videojet 1580', errorCode: 'E52', symptoms: lastUserMessage });
    return `### 🚨 Diagnostic IA : ${diag.title}
**Criticité :** \`${diag.severity}\` | **Arrêt estimé :** ${diag.estimatedDowntimeMin} minutes

#### 🔍 Causes Probables :
${diag.probableCauses.map((c) => `- ${c}`).join('\n')}

#### 🛠️ Procédure d'Intervention Étape par Étape :
${diag.actionSteps.map((s) => `**Étape ${s.step} :** ${s.action} ${s.precaution ? `*(⚠️ ${s.precaution})*` : ''}`).join('\n\n')}

#### 📦 Pièces & Consommables Nécessaires :
${diag.requiredParts.map((p) => `- **${p.name}** (Réf: \`${p.partNumber}\`) — Quantité : ${p.quantity}`).join('\n')}

> **Conseil Préventif :** ${diag.preventiveAdvice}`;
  }

  if (lowerMsg.includes('fa10') || lowerMsg.includes('gutter') || lowerMsg.includes('gouttiere') || lowerMsg.includes('buse')) {
    const diag = await runDiagnostic({ model: 'Videojet 1880', errorCode: 'FA10', symptoms: lastUserMessage });
    return `### 🚨 Diagnostic IA : ${diag.title}
**Criticité :** \`${diag.severity}\` (Ligne Arrêtée) | **Arrêt estimé :** ${diag.estimatedDowntimeMin} minutes

#### 🔍 Diagnostic :
${diag.probableCauses.map((c) => `- ${c}`).join('\n')}

#### 🛠️ Actions Immédiates à Réaliser :
${diag.actionSteps.map((s) => `1. **${s.action}** ${s.precaution ? `\n   > ⚠️ *${s.precaution}*` : ''}`).join('\n')}

#### 📦 Pièces Requises :
${diag.requiredParts.map((p) => `- \`${p.partNumber}\` : **${p.name}**`).join('\n')}`;
  }

  if (lowerMsg.includes('encre') || lowerMsg.includes('solvant') || lowerMsg.includes('pehd') || lowerMsg.includes('plastique') || lowerMsg.includes('chimie')) {
    const rec = await recommendInkAndSolvent({ substrate: lastUserMessage });
    return `### 🧪 Recommandation Chimie & Encres Videojet

**Technologie Recommandée :** ${rec.recommendedTechnology}

#### 🎯 Encre Préconisée :
- **Désignation :** ${rec.primaryInk.name} (\`${rec.primaryInk.partNumber}\`)
- **Chimie :** ${rec.primaryInk.chemistry}
- **Vitesse de séchage :** ${rec.primaryInk.dryingTimeSeconds} seconde(s)
- **Couleur :** ${rec.primaryInk.color}

**Avantages Clés :**
${rec.primaryInk.features.map((f) => `- ${f}`).join('\n')}

${rec.associatedMakeUp ? `#### 💧 Solvant Associé (Make-up) :
- **Réf :** \`${rec.associatedMakeUp.partNumber}\` — ${rec.associatedMakeUp.name}
- **Consommation estimée :** ${rec.associatedMakeUp.consumptionRatio}` : ''}

#### 📋 Conformités Réglementaires :
${rec.regulatoryCompliance.map((r) => `✅ ${r}`).join('\n')}`;
  }

  if (lowerMsg.includes('markem') || lowerMsg.includes('domino') || lowerMsg.includes('concurrent') || lowerMsg.includes('argument') || lowerMsg.includes('pitch')) {
    const compName = lowerMsg.includes('domino') ? 'Domino' : 'Markem-Imaje';
    const pitch = await generateSalesPitch({ competitor: compName, targetIndustry: 'Agroalimentaire / Pharma Maroc' });
    return `### ⚔️ Battlecard Commerciale Videojet vs ${pitch.targetCompetitor}

**Pitch Clé :**
> "${pitch.executivePitch}"

#### 🚀 Nos Avantages Décisifs :
${pitch.keyDifferentiators.map((d) => `##### 🔹 ${d.feature}
- **Avantage Videojet :** ${d.videojetAdvantage}
- **Faiblesse Concurrente :** ${d.competitorWeakness}`).join('\n\n')}

#### 🛡️ Traitement des Objections :
${pitch.objectionHandling.map((o) => `- **Objection :** *"${o.objection}"*\n  👉 **Réponse :** ${o.counterArgument}`).join('\n\n')}

**Impact Économique :** ${pitch.tcoImpact}`;
  }

  // Default intelligent assistant response
  return `Bonjour ! Je suis le **Copilot IA Industriel Videojet Maroc**.

Je suis à votre disposition pour vous assister sur :
1. 🔧 **Le diagnostic des pannes et codes d'erreur** (CIJ 1580/1880, Laser CO2 3340, Laser Fibre 7340, TTO 6530, TIJ m610).
2. 🧪 **Le choix des encres et solvants Videojet** selon les substrats (PEHD, PET, verre lavable, film souple, carton pharma).
3. ⚔️ **Les argumentaires commerciaux et comparatifs concurrentiels** face à Markem-Imaje, Domino, Linx.
4. 📋 **Les procédures de maintenance préventive** et les références des pièces détachées officielles Videojet.

Que souhaitez-vous diagnostiquer ou analyser aujourd'hui ? *(Vous pouvez taper par exemple : "Panne E52 sur CIJ 1580" ou "Quelle encre pour bouteille huile PEHD ?" ou "Arguments vs Markem 9450")*`;
};
