export const MENU_CATEGORIES = [
  { id: 1, name: "Churraspao", sortOrder: 1, isAvailable: true },
  { id: 2, name: "Cuscuz Gourmet", sortOrder: 2, isAvailable: true },
  { id: 3, name: "Tapioca Gourmet", sortOrder: 3, isAvailable: true },
  { id: 4, name: "Porcoes", sortOrder: 4, isAvailable: true },
  { id: 5, name: "Combo Churraspao", sortOrder: 5, isAvailable: true },
  { id: 6, name: "Bebidas", sortOrder: 6, isAvailable: true },
];

const rawProducts = [
  [101, 1, "Frango", 25.9, "Carne de verdade 130g, queijo tostado por fora e recheio de frango."],
  [102, 1, "Linguica de Frango", 26.9, "Churraspao recheado com linguica de frango."],
  [103, 1, "Coracao", 27.9, "Churraspao recheado com coracao bem temperado."],
  [104, 1, "Contra File", 31.9, "Churraspao recheado com contra file."],
  [105, 1, "Carne Seca", 36.9, "Churraspao recheado com carne seca."],
  [106, 1, "Linguica de Costela", 36.9, "Churraspao recheado com linguica de costela."],
  [107, 1, "Picanha", 41.9, "Churraspao recheado com picanha. Campeao da casa."],
  [201, 2, "Frango", 22.9, "Cuscuz feito na hora, quentinho e recheado com frango."],
  [202, 2, "Contra File", 27.9, "Cuscuz gourmet recheado com contra file."],
  [203, 2, "Carne Seca", 32.9, "Cuscuz gourmet recheado com carne seca."],
  [204, 2, "Picanha", 36.9, "Cuscuz gourmet recheado com picanha."],
  [301, 3, "Frango", 24.9, "Tapioca crocante por fora e recheada com frango."],
  [302, 3, "Contra File", 29.9, "Tapioca gourmet recheada com contra file."],
  [303, 3, "Carne Seca", 34.9, "Tapioca gourmet recheada com carne seca."],
  [304, 3, "Picanha", 39.9, "Tapioca gourmet recheada com picanha."],
  [401, 4, "Batata Frita", 14.9, "Porcao de batata frita crocante."],
  [402, 4, "Batata Rustica", 16.9, "Porcao de batata rustica temperada."],
  [403, 4, "Aneis de Cebola com Queijo Derretido", 17.9, "Aneis de cebola com queijo derretido."],
  [501, 5, "Qualquer Churraspao + Refrigerante Lata", 0, "Combo perfeito para acompanhar seu momento."],
  [601, 6, "Coca-Cola 1 Litro", 10.9, "Refrigerante Coca-Cola 1 litro."],
  [602, 6, "Coca-Cola Lata", 7.0, "Refrigerante Coca-Cola lata."],
  [603, 6, "Coca-Cola 600 ml", 8.0, "Refrigerante Coca-Cola 600 ml."],
  [604, 6, "Pepsi 600 ml", 8.0, "Refrigerante Pepsi 600 ml."],
  [605, 6, "Pepsi Lata", 6.0, "Refrigerante Pepsi lata."],
  [606, 6, "Sprite Lata", 6.0, "Refrigerante Sprite lata."],
  [607, 6, "Fanta Uva Lata", 6.0, "Refrigerante Fanta Uva lata."],
  [608, 6, "Del Valle Pessego", 7.5, "Suco Del Valle sabor pessego."],
  [609, 6, "Del Valle Uva", 7.5, "Suco Del Valle sabor uva."],
  [610, 6, "Agua com Gas", 5.0, "Agua com gas."],
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
