/* ================= obras do portfólio ================= */

export interface Artwork {
  src: string;
  title: string;
  medium: string;
  year: string;
  className: string;
  aspect: string;
}

export const artworks: Artwork[] = [
  {
    src: "/images/art-watercolor.jpg",
    title: "Sol em Aquarela",
    medium: "Aquarela sobre papel",
    year: "2026",
    className: "md:col-span-7",
    aspect: "aspect-[4/5]",
  },
  {
    src: "/images/art-portrait.jpg",
    title: "Sementes de Luz",
    medium: "Retrato digital",
    year: "2026",
    className: "md:col-span-5 md:mt-20",
    aspect: "aspect-[4/5]",
  },
  {
    src: "/images/art-character.jpg",
    title: "Cavaleira Girassol",
    medium: "Concept art",
    year: "2025",
    className: "md:col-span-5",
    aspect: "aspect-[3/4]",
  },
  {
    src: "/images/art-landscape.jpg",
    title: "Casa entre Girassóis",
    medium: "Guache",
    year: "2024",
    className: "md:col-span-7 md:mt-14",
    aspect: "aspect-[16/11]",
  },
  {
    src: "/images/art-chibi.jpg",
    title: "Bruxinha Sol",
    medium: "Chibi",
    year: "2025",
    className: "md:col-span-5 md:-mt-6",
    aspect: "aspect-square",
  },
  {
    src: "/images/art-editorial.jpg",
    title: "Jardineira",
    medium: "Ilustração editorial",
    year: "2026",
    className: "md:col-span-7 md:mt-16",
    aspect: "aspect-[4/3]",
  },
];

/* ================= estilos de arte p/ comissão ================= */

export interface CommissionType {
  id: string;
  name: string;
  price: number;
}

export const commissionTypes: CommissionType[] = [
  { id: "sketch", name: "Sketch", price: 60 },
  { id: "lineart", name: "Lineart", price: 80 },
  { id: "chibi", name: "Chibi", price: 90 },
  { id: "icone", name: "Ícone / Avatar", price: 100 },
  { id: "emotes", name: "Emotes / Stickers", price: 110 },
  { id: "retrato-simples", name: "Retrato Simples", price: 120 },
  { id: "pixel-art", name: "Pixel Art", price: 140 },
  { id: "tattoo-flash", name: "Tattoo Flash", price: 150 },
  { id: "busto", name: "Personagem Busto", price: 150 },
  { id: "pet", name: "Pet Portrait", price: 160 },
  { id: "food", name: "Food Illustration", price: 180 },
  { id: "aquarela", name: "Aquarela Tradicional", price: 180 },
  { id: "guache", name: "Guache", price: 190 },
  { id: "wallpaper", name: "Wallpaper Pessoal", price: 190 },
  { id: "retrato-digital", name: "Retrato Digital", price: 200 },
  { id: "lettering", name: "Lettering + Ilustração", price: 200 },
  { id: "webcomic", name: "Header p/ Webcomic", price: 220 },
  { id: "poster", name: "Pôster / Print", price: 240 },
  { id: "mascote", name: "Mascote de Marca", price: 250 },
  { id: "presente", name: "Presente Personalizado", price: 260 },
  { id: "corpo-inteiro", name: "Personagem Corpo Inteiro", price: 260 },
  { id: "casal", name: "Casal Ilustrado", price: 280 },
  { id: "infantil", name: "Ilustração Infantil", price: 300 },
  { id: "familia", name: "Família Ilustrada", price: 300 },
  { id: "concept", name: "Concept Art", price: 320 },
  { id: "ambiente", name: "Pintura de Ambiente", price: 350 },
  { id: "quadrinho", name: "Quadrinho (1 página)", price: 350 },
  { id: "cenario", name: "Cenário / Background", price: 380 },
  { id: "editorial", name: "Ilustração Editorial", price: 420 },
  { id: "character-sheet", name: "Character Sheet", price: 420 },
  { id: "capa-livro", name: "Capa de Livro", price: 450 },
  { id: "capa-album", name: "Capa de Álbum", price: 480 },
];

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
