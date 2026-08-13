import "dotenv/config";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local", override: false });

const IMG = {
  churraspao: "/manus-storage/produto-burger_eabdc5c6.png",
  cuscuz: "/manus-storage/produto-porcao_5a3a6045.png",
  tapioca: "/manus-storage/produto-burger2_a3349d66.png",
  porcao: "/manus-storage/produto-porcao_5a3a6045.png",
  bebida: "/manus-storage/produto-bebida_a56d5803.png",
};

const categories = [
  ["Churraspão", "🔥"],
  ["Cuscuz Gourmet", "🌽"],
  ["Tapioca Gourmet", "🥥"],
  ["Porções", "🍟"],
  ["Bebidas", "🥤"],
];

const products = [
  ["Churraspão", "Frango", 25.9, IMG.churraspao, "Churraspão com carne de verdade, queijo tostado e preparo na chapa."],
  ["Churraspão", "Linguiça de Frango", 26.9, IMG.churraspao, "Churraspão recheado com linguiça de frango."],
  ["Churraspão", "Coração", 27.9, IMG.churraspao, "Churraspão recheado com coração bem temperado."],
  ["Churraspão", "Contra Filé", 31.9, IMG.churraspao, "Churraspão recheado com contra filé."],
  ["Churraspão", "Carne Seca", 36.9, IMG.churraspao, "Churraspão recheado com carne seca."],
  ["Churraspão", "Linguiça de Costela", 36.9, IMG.churraspao, "Churraspão recheado com linguiça de costela."],
  ["Churraspão", "Picanha", 41.9, IMG.churraspao, "Churraspão recheado com picanha."],

  ["Cuscuz Gourmet", "Frango", 22.9, IMG.cuscuz, "Cuscuz feito na hora, quentinho e recheado com frango."],
  ["Cuscuz Gourmet", "Contra Filé", 27.9, IMG.cuscuz, "Cuscuz gourmet recheado com contra filé."],
  ["Cuscuz Gourmet", "Carne Seca", 32.9, IMG.cuscuz, "Cuscuz gourmet recheado com carne seca."],
  ["Cuscuz Gourmet", "Picanha", 36.9, IMG.cuscuz, "Cuscuz gourmet recheado com picanha."],

  ["Tapioca Gourmet", "Frango", 24.9, IMG.tapioca, "Tapioca crocante por fora, recheada com frango."],
  ["Tapioca Gourmet", "Contra Filé", 29.9, IMG.tapioca, "Tapioca gourmet recheada com contra filé."],
  ["Tapioca Gourmet", "Carne Seca", 34.9, IMG.tapioca, "Tapioca gourmet recheada com carne seca."],
  ["Tapioca Gourmet", "Picanha", 39.9, IMG.tapioca, "Tapioca gourmet recheada com picanha."],

  ["Porções", "Batata Frita", 14.9, IMG.porcao, "Porção de batata frita crocante."],
  ["Porções", "Batata Rústica", 16.9, IMG.porcao, "Porção de batata rústica temperada."],
  ["Porções", "Anéis de Cebola com Queijo Derretido", 17.9, IMG.porcao, "Anéis de cebola com queijo derretido."],

  ["Bebidas", "Coca-Cola 1 Litro", 10.9, IMG.bebida, "Refrigerante Coca-Cola 1 litro."],
  ["Bebidas", "Coca-Cola Lata", 7.0, IMG.bebida, "Refrigerante Coca-Cola lata."],
  ["Bebidas", "Coca-Cola 600 ml", 8.0, IMG.bebida, "Refrigerante Coca-Cola 600 ml."],
  ["Bebidas", "Pepsi 600 ml", 8.0, IMG.bebida, "Refrigerante Pepsi 600 ml."],
  ["Bebidas", "Pepsi Lata", 6.0, IMG.bebida, "Refrigerante Pepsi lata."],
  ["Bebidas", "Sprite Lata", 6.0, IMG.bebida, "Refrigerante Sprite lata."],
  ["Bebidas", "Fanta Uva Lata", 6.0, IMG.bebida, "Refrigerante Fanta Uva lata."],
  ["Bebidas", "Del Valle Pêssego", 7.5, IMG.bebida, "Suco Del Valle sabor pêssego."],
  ["Bebidas", "Del Valle Uva", 7.5, IMG.bebida, "Suco Del Valle sabor uva."],
  ["Bebidas", "Água com Gás", 5.0, IMG.bebida, "Água com gás."],
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não está configurado no .env.local.");
  process.exit(1);
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);

async function insert(sql, params = []) {
  const [result] = await conn.execute(sql, params);
  return result.insertId;
}

try {
  const [existingProducts] = await conn.execute("SELECT COUNT(*) AS total FROM products");
  if (Number(existingProducts[0].total) > 0) {
    console.log("Já existem produtos cadastrados. O seed não alterou seu cardápio.");
    process.exit(0);
  }

  const categoryIds = new Map();
  for (const [sortOrder, [name, emoji]] of categories.entries()) {
    const id = await insert("INSERT INTO categories (name, emoji, sortOrder, isAvailable) VALUES (?, ?, ?, 1)", [name, emoji, sortOrder]);
    categoryIds.set(name, id);
  }

  for (const [sortOrder, [categoryName, name, price, imageUrl, description]] of products.entries()) {
    const categoryId = categoryIds.get(categoryName);
    const productId = await insert(
      `INSERT INTO products
        (name, description, shortDescription, categoryId, price, status, isBestSeller, isNew, isOffer, isFeatured, isExclusive, sortOrder)
       VALUES (?, ?, ?, ?, ?, 'available', ?, 0, 0, ?, 0, ?)`,
      [
        name,
        description,
        description,
        categoryId,
        price,
        ["Picanha", "Batata Frita", "Coca-Cola Lata"].includes(name) ? 1 : 0,
        ["Picanha", "Frango"].includes(name) ? 1 : 0,
        sortOrder,
      ],
    );
    await insert("INSERT INTO productImages (productId, url, fileKey, sortOrder) VALUES (?, ?, ?, 0)", [productId, imageUrl, imageUrl]);
  }

  console.log("Cardápio real do Churraspão cadastrado com sucesso.");
} catch (err) {
  console.error("Erro ao cadastrar cardápio:", err);
  process.exit(1);
} finally {
  await conn.end();
}
