export interface WallpaperArtwork {
  /** File name in `src/assets/wallpapers`, without the `.jpg` extension. */
  id: string;
  title: string;
  artist: string;
  year: string;
}

/**
 * Desktop wallpapers in picker order. Public-domain paintings sourced from
 * Wikimedia Commons (file name noted per entry), resized to 2560px wide.
 */
export const WALLPAPER_ARTWORKS: WallpaperArtwork[] = [
  // Van Gogh - Starry Night - Google Art Project.jpg
  {
    id: 'van-gogh-la-noche-estrellada',
    title: 'La noche estrellada',
    artist: 'Van Gogh',
    year: '1889',
  },
  // Vincent van Gogh - Starry Night - Google Art Project.jpg (Starry Night Over the Rhône)
  {
    id: 'van-gogh-noche-estrellada-sobre-el-rodano',
    title: 'Noche estrellada sobre el Ródano',
    artist: 'Van Gogh',
    year: '1888',
  },
  // Amandelbloesem - s0176V1962 - Van Gogh Museum.jpg
  { id: 'van-gogh-almendro-en-flor', title: 'Almendro en flor', artist: 'Van Gogh', year: '1890' },
  // Wheat Field with Cypresses MET DT1567.jpg
  {
    id: 'van-gogh-campo-de-trigo-con-cipreses',
    title: 'Campo de trigo con cipreses',
    artist: 'Van Gogh',
    year: '1889',
  },
  // Korenveld met kraaien - s0149V1962 - Van Gogh Museum.jpg
  {
    id: 'van-gogh-campo-de-trigo-con-cuervos',
    title: 'Campo de trigo con cuervos',
    artist: 'Van Gogh',
    year: '1890',
  },
  // Vincent van Gogh - Irises (1889).jpg
  { id: 'van-gogh-lirios', title: 'Lirios', artist: 'Van Gogh', year: '1889' },
  // Camille Pissarro - Boulevard Montmartre at Night - c 1897 - National Gallery UK.jpg
  {
    id: 'pissarro-bulevar-montmartre-de-noche',
    title: 'Bulevar Montmartre de noche',
    artist: 'Pissarro',
    year: '1897',
  },
  // The Boulevard Montmartre on a Winter Morning MET DT1906.jpg
  {
    id: 'pissarro-bulevar-montmartre-invierno',
    title: 'Bulevar Montmartre, mañana de invierno',
    artist: 'Pissarro',
    year: '1897',
  },
  // PISSARRO Camille L'Avenue de l'Opéra Huile sur toile.jpg
  {
    id: 'pissarro-avenida-de-la-opera',
    title: 'La avenida de la Ópera',
    artist: 'Pissarro',
    year: '1898',
  },
  // Camille Pissarro, The Garden of the Tuileries on a Spring Morning, 1899.jpg
  {
    id: 'pissarro-tullerias-primavera',
    title: 'Jardín de las Tullerías, mañana de primavera',
    artist: 'Pissarro',
    year: '1899',
  },
  // Camille Pissarro - Red roofs, corner of a village, winter - Google Art Project.jpg
  { id: 'pissarro-tejados-rojos', title: 'Los tejados rojos', artist: 'Pissarro', year: '1877' },
  // Monet - Impression, Sunrise.jpg
  {
    id: 'monet-impresion-sol-naciente',
    title: 'Impresión, sol naciente',
    artist: 'Monet',
    year: '1872',
  },
  // Claude Monet - Poppy Field - Google Art Project.jpg
  { id: 'monet-campo-de-amapolas', title: 'Campo de amapolas', artist: 'Monet', year: '1873' },
  // Claude Monet - The Magpie - Google Art Project.jpg
  { id: 'monet-la-urraca', title: 'La urraca', artist: 'Monet', year: '1869' },
  // Gustave Caillebotte - Paris Street; Rainy Day - Google Art Project.jpg
  {
    id: 'caillebotte-calle-de-paris-dia-lluvioso',
    title: 'Calle de París, día lluvioso',
    artist: 'Caillebotte',
    year: '1877',
  },
  // Georges Seurat - A Sunday on La Grande Jatte -- 1884 - Google Art Project.jpg
  {
    id: 'seurat-domingo-en-la-grande-jatte',
    title: 'Tarde de domingo en la isla de la Grande Jatte',
    artist: 'Seurat',
    year: '1884–86',
  },
  // The Fighting Temeraire, JMW Turner, National Gallery.jpg
  {
    id: 'turner-el-temerario',
    title: 'El Temerario remolcado a su último atraque',
    artist: 'Turner',
    year: '1839',
  },
];

export function resolveWallpaperId(storedId: string, availableIds: Set<string>): string | null {
  if (availableIds.has(storedId)) return storedId;
  return null;
}
