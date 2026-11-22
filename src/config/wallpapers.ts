/** Art periods used to group wallpapers in the picker, oldest first. */
export const WALLPAPER_ERAS = [
  'Renacimiento',
  'Barroco',
  'Romanticismo',
  'Ukiyo-e',
  'Impresionismo',
  'Postimpresionismo',
] as const;

export type WallpaperEra = (typeof WALLPAPER_ERAS)[number];

export interface WallpaperArtwork {
  /** File name in `src/assets/wallpapers`, without the `.jpg` extension. */
  id: string;
  title: string;
  artist: string;
  year: string;
  era: WallpaperEra;
}

/**
 * Desktop wallpapers in picker order, grouped by era. Public-domain paintings sourced from
 * Wikimedia Commons (file name noted per entry), resized to 2560px wide.
 */
export const WALLPAPER_ARTWORKS: WallpaperArtwork[] = [
  // San Romano Battle (Paolo Uccello, London) 01.jpg
  {
    id: 'uccello-la-batalla-de-san-romano',
    title: 'La batalla de San Romano',
    artist: 'Uccello',
    year: 'c. 1438–40',
    era: 'Renacimiento',
  },
  // Leonardo da Vinci - The Last Supper high res.jpg
  {
    id: 'leonardo-la-ultima-cena',
    title: 'La última cena',
    artist: 'Leonardo',
    year: '1495–98',
    era: 'Renacimiento',
  },
  // Raphael School of Athens.jpg
  {
    id: 'rafael-la-escuela-de-atenas',
    title: 'La escuela de Atenas',
    artist: 'Rafael',
    year: '1509–11',
    era: 'Renacimiento',
  },
  // Michelangelo - Creation of Adam (cropped).jpg
  {
    id: 'miguel-angel-la-creacion-de-adan',
    title: 'La creación de Adán',
    artist: 'Miguel Ángel',
    year: 'c. 1512',
    era: 'Renacimiento',
  },
  // Les Noces de Cana - Paolo Veronese - Musée du Louvre Peintures INV 142 ; MR 384.jpg
  {
    id: 'veronese-las-bodas-de-cana',
    title: 'Las bodas de Caná',
    artist: 'Veronese',
    year: '1563',
    era: 'Renacimiento',
  },
  // Pieter Bruegel the Elder - The Tower of Babel (Vienna) - Google Art Project - edited.jpg
  {
    id: 'bruegel-la-torre-de-babel',
    title: 'La torre de Babel',
    artist: 'Bruegel',
    year: '1563',
    era: 'Renacimiento',
  },
  // Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project.jpg
  {
    id: 'bruegel-cazadores-en-la-nieve',
    title: 'Cazadores en la nieve',
    artist: 'Bruegel',
    year: '1565',
    era: 'Renacimiento',
  },
  // The Calling of Saint Matthew-Caravaggo (1599-1600).jpg
  {
    id: 'caravaggio-la-vocacion-de-san-mateo',
    title: 'La vocación de san Mateo',
    artist: 'Caravaggio',
    year: '1599–1600',
    era: 'Barroco',
  },
  // Velazquez-The Surrender of Breda.jpg
  {
    id: 'velazquez-la-rendicion-de-breda',
    title: 'La rendición de Breda',
    artist: 'Velázquez',
    year: '1634–35',
    era: 'Barroco',
  },
  // The Nightwatch by Rembrandt - Rijksmuseum.jpg
  {
    id: 'rembrandt-la-ronda-de-noche',
    title: 'La ronda de noche',
    artist: 'Rembrandt',
    year: '1642',
    era: 'Barroco',
  },
  // Claude Lorrain - Seaport with the Embarkation of the Queen of Sheba - WGA05002.jpg
  {
    id: 'lorena-puerto-con-el-embarque-de-la-reina-de-saba',
    title: 'Puerto con el embarque de la reina de Saba',
    artist: 'Claudio de Lorena',
    year: '1648',
    era: 'Barroco',
  },
  // Johannes Vermeer - View of Delft - 92 - Mauritshuis.jpg
  {
    id: 'vermeer-vista-de-delft',
    title: 'Vista de Delft',
    artist: 'Vermeer',
    year: '1660–61',
    era: 'Barroco',
  },
  // De molen bij Wijk bij Duurstede Rijksmuseum SK-C-211.jpeg
  {
    id: 'ruisdael-el-molino-de-wijk',
    title: 'El molino de Wijk bij Duurstede',
    artist: 'Ruisdael',
    year: 'c. 1670',
    era: 'Barroco',
  },
  // Meindert Hobbema 001.jpg
  {
    id: 'hobbema-la-avenida-de-middelharnis',
    title: 'La avenida de Middelharnis',
    artist: 'Hobbema',
    year: '1689',
    era: 'Barroco',
  },
  // Grand Canal, Looking Northeast from Palazo Balbi toward the Rialto Bridge.jpg
  {
    id: 'canaletto-el-gran-canal',
    title: 'El Gran Canal',
    artist: 'Canaletto',
    year: 'c. 1725',
    era: 'Barroco',
  },
  // Caspar David Friedrich - Mondaufgang am Meer - Google Art Project.jpg
  {
    id: 'friedrich-salida-de-la-luna-sobre-el-mar',
    title: 'Salida de la luna sobre el mar',
    artist: 'Friedrich',
    year: '1822',
    era: 'Romanticismo',
  },
  // The Fighting Temeraire, JMW Turner, National Gallery.jpg
  {
    id: 'turner-el-temerario',
    title: 'El Temerario remolcado a su último atraque',
    artist: 'Turner',
    year: '1839',
    era: 'Romanticismo',
  },
  // Hovhannes Aivazovsky - The Ninth Wave - Google Art Project.jpg
  {
    id: 'aivazovsky-la-novena-ola',
    title: 'La novena ola',
    artist: 'Aivazovsky',
    year: '1850',
    era: 'Romanticismo',
  },
  // Albert Bierstadt - Among the Sierra Nevada, California - Google Art Project.jpg
  {
    id: 'bierstadt-entre-la-sierra-nevada',
    title: 'Entre la Sierra Nevada, California',
    artist: 'Bierstadt',
    year: '1868',
    era: 'Romanticismo',
  },
  // Great Wave off Kanagawa2.jpg
  {
    id: 'hokusai-la-gran-ola-de-kanagawa',
    title: 'La gran ola de Kanagawa',
    artist: 'Hokusai',
    year: 'c. 1831',
    era: 'Ukiyo-e',
  },
  // Monet - Impression, Sunrise.jpg
  {
    id: 'monet-impresion-sol-naciente',
    title: 'Impresión, sol naciente',
    artist: 'Monet',
    year: '1872',
    era: 'Impresionismo',
  },
  // Claude Monet - Poppy Field - Google Art Project.jpg
  {
    id: 'monet-campo-de-amapolas',
    title: 'Campo de amapolas',
    artist: 'Monet',
    year: '1873',
    era: 'Impresionismo',
  },
  // Claude Monet - The Magpie - Google Art Project.jpg
  {
    id: 'monet-la-urraca',
    title: 'La urraca',
    artist: 'Monet',
    year: '1869',
    era: 'Impresionismo',
  },
  // Camille Pissarro - Boulevard Montmartre at Night - c 1897 - National Gallery UK.jpg
  {
    id: 'pissarro-bulevar-montmartre-de-noche',
    title: 'Bulevar Montmartre de noche',
    artist: 'Pissarro',
    year: '1897',
    era: 'Impresionismo',
  },
  // The Boulevard Montmartre on a Winter Morning MET DT1906.jpg
  {
    id: 'pissarro-bulevar-montmartre-invierno',
    title: 'Bulevar Montmartre, mañana de invierno',
    artist: 'Pissarro',
    year: '1897',
    era: 'Impresionismo',
  },
  // PISSARRO Camille L'Avenue de l'Opéra Huile sur toile.jpg
  {
    id: 'pissarro-avenida-de-la-opera',
    title: 'La avenida de la Ópera',
    artist: 'Pissarro',
    year: '1898',
    era: 'Impresionismo',
  },
  // Camille Pissarro, The Garden of the Tuileries on a Spring Morning, 1899.jpg
  {
    id: 'pissarro-tullerias-primavera',
    title: 'Jardín de las Tullerías, mañana de primavera',
    artist: 'Pissarro',
    year: '1899',
    era: 'Impresionismo',
  },
  // Camille Pissarro - Red roofs, corner of a village, winter - Google Art Project.jpg
  {
    id: 'pissarro-tejados-rojos',
    title: 'Los tejados rojos',
    artist: 'Pissarro',
    year: '1877',
    era: 'Impresionismo',
  },
  // The Flood at Port-Marly - 1876 - Alfred Sisley.jpg
  {
    id: 'sisley-la-inundacion-en-port-marly',
    title: 'La inundación en Port-Marly',
    artist: 'Sisley',
    year: '1876',
    era: 'Impresionismo',
  },
  // Berthe Morisot - Jour d'été, 1879.jpg
  {
    id: 'morisot-dia-de-verano',
    title: 'Día de verano',
    artist: 'Morisot',
    year: '1879',
    era: 'Impresionismo',
  },
  // Gustave Caillebotte - Paris Street; Rainy Day - Google Art Project.jpg
  {
    id: 'caillebotte-calle-de-paris-dia-lluvioso',
    title: 'Calle de París, día lluvioso',
    artist: 'Caillebotte',
    year: '1877',
    era: 'Impresionismo',
  },
  // Van Gogh - Starry Night - Google Art Project.jpg
  {
    id: 'van-gogh-la-noche-estrellada',
    title: 'La noche estrellada',
    artist: 'Van Gogh',
    year: '1889',
    era: 'Postimpresionismo',
  },
  // Vincent van Gogh - Starry Night - Google Art Project.jpg (Starry Night Over the Rhône)
  {
    id: 'van-gogh-noche-estrellada-sobre-el-rodano',
    title: 'Noche estrellada sobre el Ródano',
    artist: 'Van Gogh',
    year: '1888',
    era: 'Postimpresionismo',
  },
  // Amandelbloesem - s0176V1962 - Van Gogh Museum.jpg
  {
    id: 'van-gogh-almendro-en-flor',
    title: 'Almendro en flor',
    artist: 'Van Gogh',
    year: '1890',
    era: 'Postimpresionismo',
  },
  // Wheat Field with Cypresses MET DT1567.jpg
  {
    id: 'van-gogh-campo-de-trigo-con-cipreses',
    title: 'Campo de trigo con cipreses',
    artist: 'Van Gogh',
    year: '1889',
    era: 'Postimpresionismo',
  },
  // Korenveld met kraaien - s0149V1962 - Van Gogh Museum.jpg
  {
    id: 'van-gogh-campo-de-trigo-con-cuervos',
    title: 'Campo de trigo con cuervos',
    artist: 'Van Gogh',
    year: '1890',
    era: 'Postimpresionismo',
  },
  // Vincent van Gogh - Irises (1889).jpg
  {
    id: 'van-gogh-lirios',
    title: 'Lirios',
    artist: 'Van Gogh',
    year: '1889',
    era: 'Postimpresionismo',
  },
  // Georges Seurat - A Sunday on La Grande Jatte -- 1884 - Google Art Project.jpg
  {
    id: 'seurat-domingo-en-la-grande-jatte',
    title: 'Tarde de domingo en la isla de la Grande Jatte',
    artist: 'Seurat',
    year: '1884–86',
    era: 'Postimpresionismo',
  },
  // Cezanne - Mont Sainte-Victoire, Courtauld.jpg
  {
    id: 'cezanne-la-montana-sainte-victoire',
    title: 'La montaña Sainte-Victoire',
    artist: 'Cézanne',
    year: '1887',
    era: 'Postimpresionismo',
  },
  // Paul Gauguin - Tahitian Landscape - Google Art Project.jpg
  {
    id: 'gauguin-paisaje-tahitiano',
    title: 'Paisaje tahitiano',
    artist: 'Gauguin',
    year: '1891',
    era: 'Postimpresionismo',
  },
  // Henri Rousseau - Surprise!.jpg
  {
    id: 'rousseau-sorprendido',
    title: 'Tigre en una tormenta tropical',
    artist: 'Rousseau',
    year: '1891',
    era: 'Postimpresionismo',
  },
];

export function resolveWallpaperId(storedId: string, availableIds: Set<string>): string | null {
  if (availableIds.has(storedId)) return storedId;
  return null;
}
