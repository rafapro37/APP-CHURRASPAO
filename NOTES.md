# Contexto do projeto CHURRASPÃO E CIA (notas internas)

## Status
- Projeto webdev fullstack (web-db-user) em /home/ubuntu/churraspaoo
- Banco com schema completo aplicado (categories, products, productImages, productAddons, productVariations, productAccompaniments, promotions, coupons, orders, favorites; users ganhou phone + loyaltyPoints)
- Seed de dados de exemplo executado com sucesso (node seed.mjs)
- TypeScript limpo (0 erros)
- Rotas tRPC: catalog.*, favorites.*, coupons.redeem, orders.*, profile.*, admin.* (adminProcedure com role==='admin')

## Imagens geradas (usar exatamente como estão no código, URLs já usadas em client/src/lib/brand.ts)
- Logo: /manus-storage/logo-churraspaoo_64b4291f.png
- Hero: /manus-storage/hero-banner_75f8350d.png
- Picanha: /manus-storage/produto-picanha_94aa8da1.png
- Burger: /manus-storage/produto-burger_eabdc5c6.png
- Burger2: /manus-storage/produto-burger2_a3349d66.png
- Porção: /manus-storage/produto-porcao_5a3a6045.png
- Combo: /manus-storage/produto-combo_849b8543.png
- Bebida: /manus-storage/produto-bebida_a56d5803.png
- Suco: /manus-storage/produto-suco_70d76203.png
- Sobremesa: /manus-storage/produto-sobremesa_2cecff48.png
- Costela: /manus-storage/produto-costela_fb1b5613.png
- Linguiça: /manus-storage/produto-linguica_a6a23774.png
- Hotdog: /manus-storage/produto-hotdog_2834e84e.png
- Frango: /manus-storage/produto-frango_953b9e3c.png

## Marca
- Nome exato: CHURRASPÃO E CIA
- Banner home: "Seu churrasco começa aqui 🔥"
- Paleta: fundo #0B0B0B, cards #171717, laranja #D96508, destaque #F47A0B, branco, #BDBDBD, border #333333
- Fontes: Oswald (display), Montserrat (body), Caveat (handwritten) — index.html já carrega
- CSS classes: .font-display, .font-hand, .text-brand, .bg-brand, .charcoal-texture, .ember-glow, .fade-up, .btn-press, .pulse-ember
- AppLayout: splash + header + bottom nav (Início /cardapio /pedidos /ofertas /perfil), tema dark default

## Restrições do usuário
- Novos pedidos no painel destacados em laranja
- Botão "Adicionar ao carrinho" fixo na página de produto
- Recálculo automático de preço com adicionais em tempo real
- Promoções ativadas/encerradas automaticamente (server/db.ts isPromotionActiveNow)

## Pendências (ver todo.md)
- App cliente: Home (feito), Cardápio, Produto (detalhe), Carrinho, Checkout, Pedidos (tracking), Ofertas, Fidelidade, Perfil
- Admin: dashboard gráficos, pedidos, cardápio CRUD + drag-drop categorias, promoções, cupons, clientes — usar DashboardLayout
- Testes vitest + checkpoint final
- App.tsx: themeProvider defaultTheme="dark", rotas

## Admin acesso
- Usuário Manus owner vira admin automaticamente (role admin no upsertUser). Promover outros via DB.
- Rotas admin: /admin/*
## Atualização de progresso (fase 5)
Páginas do app cliente já criadas (falta só registrar rotas em App.tsx + themeProvider dark):
- Home.tsx (feito, com banner "Seu churrasco começa aqui 🔥", categorias, mais pedidos, combos, footer marca)
- Cardapio.tsx (tabs categorias, busca, grid)
- Produto.tsx (galeria 6 fotos, variações, adicionais, acompanhamentos, preço em tempo real, botão fixo)
- Carrinho.tsx (itens, qty, cupom, resumo)
- Checkout.tsx (entrega/retirada, PIX/cartão/dinheiro, confirmação)
- Pedido.tsx (tracking tempo real refetch 8s, timeline)
- Pedidos.tsx (histórico do usuário)
- Ofertas.tsx (promoções ativas + produtos oferta)
- Perfil.tsx (login, clube fidelidade pontos, logout)

### Falta para fase 5 (admin)
- Registrar rotas em App.tsx: / /cardapio /produto/:id /carrinho /checkout /pedido/:code /pedidos /ofertas /perfil /admin(/dashboard|/pedidos|/cardapio|/produtos|/produto/:id/novo|/produto/:id/editar|/categorias|/promocoes|/cupons|/clientes)
- App.tsx: ThemeProvider defaultTheme="dark"
- AdminLayout.tsx: sidebar própria (Dashboard, Pedidos, Cardápio, Categorias, Promoções, Cupons, Clientes) com BRAND
- AdminDashboard (gráficos recharts: faturamento mensal, pedidos por hora, KPIs, top produtos)
- AdminPedidos (cards por status, novos destacados laranja, mudança de status)
- AdminProdutos (listagem com edição rápida inline + CRUD completo com fotos até 6 base64 upload + adicionais/variações/acomp)
- AdminCategorias (reorder drag-drop)
- AdminPromocoes (agendamento: data início/fim, dia da semana, horário)
- AdminCupons
- AdminClientes
- Admin: rota protegida por role admin (useAuth().user?.role !== 'admin' → negar)

### Testes vitest
- Criar server/tests com: admin orders, promotion active window, coupon redeem, order create, category CRUD — rodar pnpm test
