export const MENU_CATEGORIES = [
  { id: 1, name: "Churraspão", sortOrder: 1, isAvailable: true },
  { id: 2, name: "Cuscuz Gourmet", sortOrder: 2, isAvailable: true },
  { id: 3, name: "Tapioca Gourmet", sortOrder: 3, isAvailable: true },
  { id: 4, name: "Porções", sortOrder: 4, isAvailable: true },
  { id: 5, name: "Combo Churraspão", sortOrder: 5, isAvailable: true },
  { id: 6, name: "Bebidas", sortOrder: 6, isAvailable: true },
];

const rawProducts = [
  [101, 1, "Frango", 25.9, "Carne de verdade 130g, queijo tostado por fora e recheio de frango."],
  [102, 1, "Linguiça de Frango", 26.9, "Churraspão recheado com linguiça de frango."],
  [103, 1, "Coração", 27.9, "Churraspão recheado com coração bem temperado."],
  [104, 1, "Contra Filé", 31.9, "Churraspão recheado com contra filé."],
  [105, 1, "Carne Seca", 36.9, "Churraspão recheado com carne seca."],
  [106, 1, "Linguiça de Costela", 36.9, "Churraspão recheado com linguiça de costela."],
  [107, 1, "Picanha", 41.9, "Churraspão recheado com picanha. Campeão da casa."],
  [201, 2, "Frango", 22.9, "Cuscuz feito na hora, quentinho e recheado com frango."],
  [202, 2, "Contra Filé", 27.9, "Cuscuz gourmet recheado com contra filé."],
  [203, 2, "Carne Seca", 32.9, "Cuscuz gourmet recheado com carne seca."],
  [204, 2, "Picanha", 36.9, "Cuscuz gourmet recheado com picanha."],
  [301, 3, "Frango", 24.9, "Tapioca crocante por fora e recheada com frango."],
  [302, 3, "Contra Filé", 29.9, "Tapioca gourmet recheada com contra filé."],
  [303, 3, "Carne Seca", 34.9, "Tapioca gourmet recheada com carne seca."],
  [304, 3, "Picanha", 39.9, "Tapioca gourmet recheada com picanha."],
  [401, 4, "Batata Frita", 14.9, "Porção de batata frita crocante."],
  [402, 4, "Batata Rústica", 16.9, "Porção de batata rústica temperada."],
  [403, 4, "Anéis de Cebola com Queijo Derretido", 17.9, "Anéis de cebola com queijo derretido."],
  [501, 5, "Qualquer Churraspão + Refrigerante Lata", 0, "Combo perfeito para acompanhar seu momento."],
  [601, 6, "Coca-Cola 1 Litro", 10.9, "Refrigerante Coca-Cola 1 litro."],
  [602, 6, "Coca-Cola Lata", 7.0, "Refrigerante Coca-Cola lata."],
  [603, 6, "Coca-Cola 600 ml", 8.0, "Refrigerante Coca-Cola 600 ml."],
  [604, 6, "Pepsi 600 ml", 8.0, "Refrigerante Pepsi 600 ml."],
  [605, 6, "Pepsi Lata", 6.0, "Refrigerante Pepsi lata."],
  [606, 6, "Sprite Lata", 6.0, "Refrigerante Sprite lata."],
  [607, 6, "Fanta Uva Lata", 6.0, "Refrigerante Fanta Uva lata."],
  [608, 6, "Del Valle Pêssego", 7.5, "Suco Del Valle sabor pêssego."],
  [609, 6, "Del Valle Uva", 7.5, "Suco Del Valle sabor uva."],
  [610, 6, "Água com Gás", 5.0, "Água com gás."],
] as const;

export const MENU_PRODUCTS = rawProducts.map(([id, categoryId, name, price, description], index) => {
  const category = MENU_CATEGORIES.find((item) => item.id === categoryId);
  const productName = categoryId <= 3 ? `${category?.name} - ${name}` : name;

  return {
    id,
    name: productName,
    description,
    shortDescription: description,
    categoryId,
    price,
    promoPrice: null,
    status: "available",
    isBestSeller: false,
    isNew: false,
    isOffer: categoryId === 5,
    isFeatured: [101, 107, 204, 304, 501].includes(id),
    isExclusive: false,
    sortOrder: index,
    images: [],
    addons: [],
    variations: [],
    accompaniments: [],
    activePromo: null,
  };
});
