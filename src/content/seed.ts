/**
 * ------------------------------------------------------------------
 *  Conteúdo editorial do site
 * ------------------------------------------------------------------
 *  Este arquivo é a "redação" do site: o que existe aqui é semeado no
 *  SQLite (data/atelier.sqlite) por `npm run db:build`. Depois disso, o
 *  banco passa a ser a fonte da verdade — o site lê tudo do SQLite e
 *  pode ser editado pelo /estudio ou por SQL direto.
 * ------------------------------------------------------------------
 */

/* ----------------------------- site ------------------------------ */

export const SITE = {
  name: "Atelier Girassol",
  tagline: "estúdio de ilustração",
  email: "contato@ateliergirassol.art",
  location: "Minas Gerais, BR",
  since: "2019",
  heroEyebrow: "Atelier Girassol — estúdio de ilustração",
  heroTitle: "Um estúdio de ilustração feita *à mão*, sem pressa e sem atalhos.",
  heroLede:
    "Ilustração feita à mão — aquarela, guache e tinta digital — no interior de Minas Gerais. Retratos, capas de livro, personagens e pôsteres para quem valoriza o traço de verdade.",
  heroNote:
    "Cada comissão é desenhada do zero: sem arte gerada, sem inteligência artificial. Só referência, pincel e café.",
  heroImage: "/images/artist.jpg",
  heroCaption: "Helena, estudo no campo — 2025",
  backgroundImage: "/images/field.jpg",
  stats: ["desde 2019", "120+ obras entregues", "resposta em até 48h"],
  bookSectionEyebrow: "01 — Livro ilustrado",
  bookSectionTitle: "O Jardim das Horas",
  bookSectionLede:
    "Obra publicada pelo ateliê: um livro ilustrado em edição artesanal. Folheie na mesa — arraste as páginas, gire o livro e clique na ilustração para vê-la ampliada.",
  gallerySectionEyebrow: "02 — Portfólio",
  gallerySectionTitle: "Trabalhos recentes",
  gallerySectionLede:
    "Seleção de peças tradicionais e digitais produzidas entre 2024 e 2026.",
  faqSectionEyebrow: "02 — Perguntas frequentes",
  faqSectionTitle: "Antes de comissionar",
  faqSectionLede:
    "Como funcionam as comissões, prazos, pagamento — e o que o estúdio não produz.",
  commissionSectionEyebrow: "03 — Comissões",
  commissionSectionTitle: "Encomende a sua arte",
  commissionSectionLede:
    "Escolha um ou mais estilos, descreva a ideia e envie. Respondemos por e-mail com orçamento e prazo.",
  commissionNote: "3 vagas restantes para abril.",
  commissionFormName: "Nome",
  commissionFormNamePlaceholder: "Como podemos te chamar?",
  commissionFormEmail: "E-mail",
  commissionFormEmailPlaceholder: "seunome@email.com",
  commissionFormIdea: "Descrição da ideia",
  commissionFormIdeaPlaceholder:
    "Conte sobre a cena, os personagens, referências, cores e prazo desejado.",
  commissionFormStyles: "Estilos de arte — selecione quantos quiser",
  commissionFormSubmit: "Enviar pedido",
  commissionFormEstimate: "Estimativa",
  commissionFormFootnote:
    "Não trabalhamos com gore, conteúdo NSFW ou cópia do estilo de outros artistas — veja o FAQ.",
  commissionFormSuccess: "Pedido enviado, {nome}.",
  commissionFormSuccessNote: "Recebemos seu pedido. Você terá retorno em até 48h úteis.",
  footerNote: "comissões abertas · BR",

  /* navegação, botões e ícone (o ícone usa o nome de um ícone Lucide) */
  siteIcon: "Flower2",
  navAboutLabel: "Sobre",
  navBookLabel: "Livro",
  navPortfolioLabel: "Portfólio",
  navFaqLabel: "FAQ",
  navCtaLabel: "Comissões",
  heroCtaPrimary: "Pedir uma comissão",
  heroCtaSecondary: "Abrir o livro",
  heroCtaTertiary: "Ver o acervo",

  /* detalhes de seção */
  bookSectionFootnote:
    "um exemplar de verdade, para folhear: arraste as páginas, gire o livro e aproxime cada ilustração",
  galleryPageEyebrow: "Acervo",
  galleryPageTitle: "Todas as obras",
  galleryPageLede:
    "As {obras} obras do estúdio e as {paginas} páginas ilustradas de *{livro}*, com suas descrições. Clique em qualquer peça para ampliar.",
  galleryWorksTitle: "Obras do estúdio",
  galleryPlatesTitle: "Páginas do livro",
  galleryPlatesNote:
    "Estas imagens são as páginas ilustradas do livro — a folha de rosto e os interlúdios ficam só com o texto e o ornamento.",
  galleryFooterNote: "acervo completo do estúdio",
  footerGalleryLabel: "Galeria",
  footerStudioLabel: "Estúdio",
  footerAdminLabel: "Admin",
  footerTopLabel: "Voltar ao topo",

  /* título da aba do navegador */
  metaTitle: "Atelier Girassol — portfólio de arte & livro ilustrado",
  metaDescription:
    "Portfólio do Atelier Girassol: ilustração, aquarela, guache e comissões abertas — com o livro ilustrado interativo “O Jardim das Horas” em 3D.",
  metaOgTitle: "Atelier Girassol — portfólio de arte & livro ilustrado",
  metaOgDescription:
    "Ilustração feita à mão desde 2019, comissões abertas e um livro ilustrado para folhear em 3D.",
} as const;

/* --------------------------- obras do site ------------------------ */
/** Imagens gerais do site → public/images/ (a pasta do livro é outra) */

export interface ArtworkSeed {
  slug: string;
  title: string;
  medium: string;
  year: string;
  image: string;
  /** nº de colunas no grid de 12 (desktop) */
  span: number;
  /** deslocamento vertical no grid, em rem */
  shift: number;
  /** proporção da moldura na grade */
  aspect: string;
  description: string;
  tags: string[];
}

export const ARTWORKS: ArtworkSeed[] = [
  {
    slug: "sol-em-aquarela",
    title: "Sol em Aquarela",
    medium: "Aquarela sobre papel",
    year: "2026",
    image: "/images/art-watercolor.jpg",
    span: 7,
    shift: 0,
    aspect: "4/5",
    description:
      "Estudo de luz feito ao ar livre: o sol entra pela janela do ateliê e vira pigmento diluído.",
    tags: ["aquarela", "tradicional"],
  },
  {
    slug: "sementes-de-luz",
    title: "Sementes de Luz",
    medium: "Retrato digital",
    year: "2026",
    image: "/images/art-portrait.jpg",
    span: 5,
    shift: 20,
    aspect: "4/5",
    description:
      "Retrato pintado em camadas de luz, inspirado nas sementes de girassol guardadas em potes de vidro.",
    tags: ["digital", "retrato"],
  },
  {
    slug: "cavaleira-girassol",
    title: "Cavaleira Girassol",
    medium: "Concept art",
    year: "2025",
    image: "/images/art-character.jpg",
    span: 5,
    shift: 0,
    aspect: "3/4",
    description:
      "Design de personagem para um livro infantil: uma cavaleira que carrega um girassol em vez de espada.",
    tags: ["digital", "personagem"],
  },
  {
    slug: "casa-entre-girassois",
    title: "Casa entre Girassóis",
    medium: "Guache",
    year: "2024",
    image: "/images/art-landscape.jpg",
    span: 7,
    shift: 14,
    aspect: "16/11",
    description:
      "A casa da avó vista do alto do morro, pintada em guache em uma tarde de janeiro.",
    tags: ["guache", "tradicional"],
  },
  {
    slug: "bruxinha-sol",
    title: "Bruxinha Sol",
    medium: "Chibi",
    year: "2025",
    image: "/images/art-chibi.jpg",
    span: 5,
    shift: -6,
    aspect: "1/1",
    description:
      "Encomenda fofa de aniversário: uma bruxinha cujo chapéu funciona como guarda-sol.",
    tags: ["digital", "chibi"],
  },
  {
    slug: "jardineira",
    title: "Jardineira",
    medium: "Ilustração editorial",
    year: "2026",
    image: "/images/art-editorial.jpg",
    span: 7,
    shift: 16,
    aspect: "4/3",
    description:
      "Peça editorial sobre o ofício de cuidar: mãos, terra e o que floresce depois.",
    tags: ["digital", "editorial"],
  },
];

/* ------------------------------ livro ----------------------------- */

export const BOOK = {
  slug: "o-jardim-das-horas",
  title: "O Jardim das Horas",
  subtitle: "Um livro ilustrado sobre as horas do dia",
  author: "Helena Duarte",
  publisher: "Atelier Girassol",
  edition: "Edição artesanal · 2026",
  description:
    "Um conto ilustrado que atravessa um jardim onde cada flor guarda uma hora do dia. Da porta do alvorecer até a última semente plantada na escuridão, cada página revela uma pequena fábula sobre tempo, memória e ternura.",
  dedication: "Para quem já esperou uma flor abrir.",
  spineLabel: "O Jardim das Horas · Helena Duarte",
  /** arte de capa — arquivo dentro de public/book/ */
  coverImage: "/book/capa.jpg",
  coverArtTitle: "Casa entre Girassóis",
} as const;

export type PageKind = "title" | "art" | "interlude" | "finale";

export interface PageSeed {
  order: number;
  slug: string;
  kind: PageKind;
  title: string;
  type: string;
  description: string;
  /** arquivo dentro de public/book/ (só a pasta do livro) */
  image?: string;
  folio?: number;
  poem?: string[];
  /** ajustes finos opcionais — o resto é calculado automaticamente */
  layout?: Partial<PageLayoutSeed>;
}

export interface PageLayoutSeed {
  fit: "contain" | "cover";
  frame: "plate" | "bleed" | "none";
  backdrop: "blur" | "tint" | "paper" | "none";
  mountTone: "paper" | "ink";
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  radius: number;
  platePad: number;
  shadow: boolean;
}

/**
 * A ordem abaixo é a ordem de leitura do miolo (frente e verso de cada
 * folha), ou seja: frente da folha 0, verso da folha 0, frente da folha 1…
 */
export const PAGES: PageSeed[] = [
  {
    order: 1,
    slug: "folha-de-rosto",
    kind: "title",
    title: "O Jardim das Horas",
    type: "Folha de rosto",
    description:
      "Página de abertura com o título, a autoria e o selo do ateliê, em ornamento dourado.",
    poem: ["Um conto ilustrado sobre as horas do dia"],
  },
  {
    order: 2,
    slug: "jardineira",
    kind: "art",
    title: "Jardineira",
    type: "Ilustração editorial",
    description:
      "A primeira página do conto: mãos que plantam antes do sol nascer. A ilustração abre a manhã do jardim.",
    image: "/book/art-editorial.jpg",
    folio: 4,
    poem: ["Toda hora começa numa mão", "que ainda não sabe o que vai florescer."],
  },
  {
    order: 3,
    slug: "estudo-no-campo",
    kind: "art",
    title: "Estudo no Campo",
    type: "Estudo em guache",
    description:
      "Caderno de campo da autora: o retrato que originou o jardim, pintado entre duas colheitas.",
    image: "/book/artist.jpg",
    folio: 5,
    poem: ["Antes de inventar o jardim,", "a autora pintou quem o plantaria."],
  },
  {
    order: 4,
    slug: "bruxinha-sol",
    kind: "art",
    title: "Bruxinha Sol",
    type: "Chibi · aguarela digital",
    description:
      "A guardiã das horas quentes aparece de chapéu aberto, protegendo os minutos do meio-dia.",
    image: "/book/art-chibi.jpg",
    folio: 6,
    poem: ["Ao meio-dia o jardim cochila", "e só a bruxinha fica de guarda."],
  },
  {
    order: 5,
    slug: "sol-em-aquarela",
    kind: "art",
    title: "Sol em Aquarela",
    type: "Aquarela sobre papel",
    description:
      "A hora dourada, dissolvida em água: a página onde o tempo fica mole de tão devagar.",
    image: "/book/art-watercolor.jpg",
    folio: 7,
    poem: ["Deixe o sol cair na água:", "ele volta pintado."],
  },
  {
    order: 6,
    slug: "cavaleira-girassol",
    kind: "art",
    title: "Cavaleira Girassol",
    type: "Concept art",
    description:
      "A cavaleira do entardecer atravessa os canteiros com o girassol-espada, recolhendo as horas perdidas.",
    image: "/book/art-character.jpg",
    folio: 8,
    poem: ["Ela não fere: aponta o girassol", "para onde o dia ainda demora."],
  },
  {
    order: 7,
    slug: "sementes-de-luz",
    kind: "art",
    title: "Sementes de Luz",
    type: "Retrato digital",
    description:
      "O retrato guardado no fim do livro — sementes de girassol em potes de vidro, luz presa para o próximo ano.",
    image: "/book/art-portrait.jpg",
    folio: 9,
    poem: ["Guarda a luz em vidro:", "o inverno também precisa de sol."],
  },
  {
    order: 8,
    slug: "o-campo-em-junho",
    kind: "art",
    title: "O Campo em Junho",
    type: "Pintura panorâmica",
    description:
      "A vista final do jardim, aberta como um panorama: todas as horas acontecendo ao mesmo tempo.",
    image: "/book/field.jpg",
    folio: 10,
    poem: ["E então o jardim inteiro cabe", "numa única respiração."],
  },
  {
    order: 9,
    slug: "interludio",
    kind: "interlude",
    title: "Interlúdio",
    type: "Página de poema",
    description:
      "Respiro antes do fim: página sem ilustração, apenas ornamento e verso.",
    folio: 11,
    poem: ["Há um jardim onde cada flor", "guarda uma hora do dia."],
  },
  {
    order: 10,
    slug: "fim",
    kind: "finale",
    title: "Fim",
    type: "Página ornamentada",
    description:
      "Encerramento decorado com ornamentos dourados que ecoam a moldura da capa.",
    poem: ["Que cada hora tua", "seja um jardim."],
  },
];

/* ------------------------------- FAQ ------------------------------ */

export interface FaqSeed {
  question: string;
  answer: string;
  list?: string[];
  footnote?: string;
}

export const FAQS: FaqSeed[] = [
  {
    question: "Como funciona uma comissão do início ao fim?",
    answer:
      "Você preenche o formulário escolhendo um ou mais estilos e descrevendo a ideia. Em até 48h úteis respondemos por e-mail com orçamento fechado e prazo. Com a aprovação, pedimos um sinal de 50% para reservar a vaga, enviamos um sketch para aprovação, produzimos a arte final e entregamos os arquivos prontos.",
  },
  {
    question: "Qual é o prazo médio de entrega?",
    answer:
      "Estilos rápidos como sketch, chibi e ícone: de 5 a 10 dias úteis. Ilustrações completas: de 10 a 20 dias úteis. Capas de livro e projetos maiores: até 30 dias úteis. O prazo exato é sempre confirmado junto com o orçamento.",
  },
  {
    question: "Quais são as formas de pagamento?",
    answer:
      "Aceitamos Pix, transferência bancária e cartão de crédito via link de pagamento. O fluxo padrão é 50% de sinal e 50% na entrega da arte final. Em pedidos abaixo de R$ 150, pedimos o pagamento integral antecipado.",
  },
  {
    question: "Quantas revisões estão incluídas?",
    answer:
      "Incluímos até 2 rodadas de revisão no sketch e 1 rodada de ajustes finos na arte final, sem custo. Mudanças estruturais pedidas após a aprovação do sketch podem ter custo adicional — sempre avisado antes de prosseguir.",
  },
  {
    question: "Que tipos de arte o estúdio não faz?",
    answer: "Para manter o atelier seguro e honesto, não aceitamos pedidos com:",
    list: [
      "Gore e violência gráfica explícita",
      "Conteúdo erótico ou NSFW",
      "Temas de ódio, discriminação ou assédio",
      "Cópia fiel do estilo de outro artista",
      "Material destinado a NFTs ou treinamento de IA",
    ],
    footnote:
      "Ficou em dúvida se a sua ideia se encaixa? Pergunte pelo formulário — respondemos sem compromisso.",
  },
  {
    question: "Posso usar a arte comercialmente?",
    answer:
      "O valor base cobre uso pessoal: presentes, perfis e coleção própria. Para uso comercial — capas publicadas, produtos, campanhas — acrescentamos uma licença de 50% sobre o valor. Os direitos autorais permanecem com o estúdio; pedimos crédito sempre que a arte for publicada.",
  },
  {
    question: "Como recebo os arquivos?",
    answer:
      "Você recebe um PNG em alta resolução (300 dpi), uma versão otimizada para redes sociais e, quando aplicável, o timelapse do processo. Arquivos editáveis podem ser combinados em projetos comerciais.",
  },
];

/* --------------------------- comissões ---------------------------- */

export interface CommissionSeed {
  slug: string;
  name: string;
  price: number;
}

export const COMMISSIONS: CommissionSeed[] = [
  { slug: "sketch", name: "Sketch", price: 60 },
  { slug: "lineart", name: "Lineart", price: 80 },
  { slug: "chibi", name: "Chibi", price: 90 },
  { slug: "icone", name: "Ícone / Avatar", price: 100 },
  { slug: "emotes", name: "Emotes / Stickers", price: 110 },
  { slug: "retrato-simples", name: "Retrato Simples", price: 120 },
  { slug: "pixel-art", name: "Pixel Art", price: 140 },
  { slug: "tattoo-flash", name: "Tattoo Flash", price: 150 },
  { slug: "busto", name: "Personagem Busto", price: 150 },
  { slug: "pet", name: "Pet Portrait", price: 160 },
  { slug: "food", name: "Food Illustration", price: 180 },
  { slug: "aquarela", name: "Aquarela Tradicional", price: 180 },
  { slug: "guache", name: "Guache", price: 190 },
  { slug: "wallpaper", name: "Wallpaper Pessoal", price: 190 },
  { slug: "retrato-digital", name: "Retrato Digital", price: 200 },
  { slug: "lettering", name: "Lettering + Ilustração", price: 200 },
  { slug: "webcomic", name: "Header p/ Webcomic", price: 220 },
  { slug: "poster", name: "Pôster / Print", price: 240 },
  { slug: "mascote", name: "Mascote de Marca", price: 250 },
  { slug: "presente", name: "Presente Personalizado", price: 260 },
  { slug: "corpo-inteiro", name: "Personagem Corpo Inteiro", price: 260 },
  { slug: "casal", name: "Casal Ilustrado", price: 280 },
  { slug: "infantil", name: "Ilustração Infantil", price: 300 },
  { slug: "familia", name: "Família Ilustrada", price: 300 },
  { slug: "concept", name: "Concept Art", price: 320 },
  { slug: "ambiente", name: "Pintura de Ambiente", price: 350 },
  { slug: "quadrinho", name: "Quadrinho (1 página)", price: 350 },
  { slug: "cenario", name: "Cenário / Background", price: 380 },
  { slug: "editorial", name: "Ilustração Editorial", price: 420 },
  { slug: "character-sheet", name: "Character Sheet", price: 420 },
  { slug: "capa-livro", name: "Capa de Livro", price: 450 },
  { slug: "capa-album", name: "Capa de Álbum", price: 480 },
];
