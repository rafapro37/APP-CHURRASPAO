# CHURRASPÃO E CIA — Project TODO

## Fundação
- [ ] Definir design system (paleta #0B0B0B/#171717/#D96508/#F47A0B, tipografia, index.css, fontes)
- [ ] Schema do banco: categories, products, product_images, product_addons, product_variations, product_accompaniments, orders, order_items, order_addresses, coupons, favorites, loyalty_events
- [ ] Aplicar migrações SQL no banco
- [ ] Helpers de banco (server/db.ts)
- [ ] Procedimentos tRPC (rotas públicas do app + adminProcedure protegidas)

## Identidade visual e assets
- [ ] Gerar logo CHURRASPÃO E CIA (preto + laranja queimado)
- [ ] Gerar fotos profissionais de produtos (picanha, lanches, porções, combos, bebidas, sobremesas)
- [ ] Upload de assets para storage estático

## Dados de exemplo
- [ ] Seed: categorias, produtos com variações/adicionais/acompanhamentos, combos, promoções, cupons

## App do cliente
- [ ] Splash screen com logo + "Churrasco de verdade, do nosso jeito."
- [ ] Home impactante: banner "Seu churrasco começa aqui 🔥", atalhos por categoria, Os Mais Pedidos, Combos, banner promocional
- [ ] Bottom navigation fixa (Início, Cardápio, Pedidos, Ofertas, Perfil) com item ativo laranja
- [ ] Cardápio com busca e filtros por categoria, selos (MAIS PEDIDO/NOVIDADE/OFERTA)
- [ ] Página de produto: galeria de fotos (até 6), variações (ponto da carne), adicionais, acompanhamentos, observação, recálculo automático de preço, botão fixo "Adicionar ao carrinho"
- [ ] Carrinho funcional: ajustar/remover itens, subtotal, taxa de entrega, cupom, total
- [ ] Checkout: entrega/retirada, endereço, pagamento (PIX/cartão/dinheiro), troco, resumo, "Finalizar pedido"
- [ ] Acompanhamento de pedido em tempo real (Novo → Aceito → Em preparo → Pronto → Saiu para entrega → Finalizado)
- [ ] Ofertas/Promoções: cards de banners
- [ ] Fidelidade (Clube Churraspão): pontos, barra de progresso, benefícios
- [ ] Perfil: dados do usuário, meus pedidos, favoritos, logout
- [ ] Microanimações (cards, botões, toast "Adicionado ao seu Churraspão 🔥")

## Painel administrativo
- [ ] Menu lateral: Dashboard, Pedidos, Cardápio, Promoções, Cupons, Clientes
- [ ] Dashboard com gráficos (vendas, faturamento, ticket médio, pedidos em andamento, mais vendidos)
- [ ] Gestão de pedidos: cards por status, novo pedido destacado em laranja, mudança de status
- [ ] CRUD de produtos: upload de até 6 fotos, nome, descrição, categoria, preço normal/promocional, status, destaques (Mais vendido, Novidade, Oferta etc.)
- [ ] Adicionais, variações de tamanho e acompanhamentos por produto (min/max, obrigatório, custo)
- [ ] Gestão de categorias com reordenação por arrastar e soltar
- [ ] Edição rápida de preço, disponibilidade e destaque
- [ ] Promoções agendadas com data/hora início/fim e ativação/encerramento automático
- [ ] Cupons de desconto (código, tipo, valor, uso único/múltiplo)
- [ ] Lista de clientes com pedidos e pontos

## Qualidade
- [ ] Testes vitest das rotas principais
- [ ] Verificação visual mobile (390x844) e desktop
- [ ] Checkpoint final e entrega
