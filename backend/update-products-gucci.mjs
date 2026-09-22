import pg from 'pg';

async function updateProducts() {
  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: 'fashionstore',
  });

  await client.connect();

  const products = [
    {
      sku: 'CZ-005',
      name: 'Chaqueta de Cuero Biker con Franjas',
      image: '/garments/biker_jacket.jpg',
      price: 185.00,
    },
    {
      sku: 'BLZ-001',
      name: 'Blazer Ejecutivo de Sastrería',
      image: '/garments/blazer.jpg',
      price: 145.00,
    },
    {
      sku: 'CAM-003',
      name: 'Camisa Oxford Algodón Puro',
      image: '/garments/white_shirt.jpg',
      price: 65.00,
    },
    {
      sku: 'JNS-004',
      name: 'Pantalones Vaqueros Denim Vintage',
      image: '/garments/denim_pants.jpg',
      price: 95.00,
    },
    {
      sku: 'VES-002',
      name: 'Vestido de Noche Satén Alta Costura',
      image: '/garments/evening_dress.jpg',
      price: 210.00,
    },
  ];

  for (const p of products) {
    await client.query(
      `UPDATE products 
       SET name = $1, 
           "imagesJson" = $2, 
           "arOverlayImageUrl" = $3,
           "basePrice" = $4
       WHERE sku = $5`,
      [p.name, JSON.stringify([p.image]), p.image, p.price, p.sku]
    );
  }

  // Also check if we have a T-Shirt product or insert one if not present
  const tshirtCheck = await client.query(`SELECT id FROM products WHERE sku = 'TSH-006'`);
  if (tshirtCheck.rowCount === 0) {
    const catRes = await client.query(`SELECT id FROM categories LIMIT 1`);
    const seasonRes = await client.query(`SELECT id FROM seasons LIMIT 1`);
    const collRes = await client.query(`SELECT id FROM collections LIMIT 1`);
    const supRes = await client.query(`SELECT id FROM suppliers LIMIT 1`);

    if (catRes.rowCount > 0) {
      const catId = catRes.rows[0].id;
      const seasonId = seasonRes.rows[0].id;
      const collId = collRes.rows[0].id;
      const supId = supRes.rows[0].id;

      const newProd = await client.query(
        `INSERT INTO products (name, description, sku, "basePrice", "imagesJson", "arOverlayImageUrl", "arAnchorType", "isFeatured", "categoryId", "seasonId", "collectionId", "supplierId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          'Polera Casual Minimalista Luxury',
          'Polera de corte oversize confeccionada en algodón mercerizado de primera calidad. Caída elegante para combinación urbana.',
          'TSH-006',
          48.00,
          JSON.stringify(['/garments/black_tshirt.jpg']),
          '/garments/black_tshirt.jpg',
          'TORSO',
          true,
          catId,
          seasonId,
          collId,
          supId,
        ]
      );

      const prodId = newProd.rows[0].id;
      const sizes = [
        { size: 'S', color: 'Negro Clásico', hex: '#000000' },
        { size: 'M', color: 'Negro Clásico', hex: '#000000' },
        { size: 'L', color: 'Negro Clásico', hex: '#000000' },
        { size: 'XL', color: 'Negro Clásico', hex: '#000000' },
      ];

      for (const s of sizes) {
        await client.query(
          `INSERT INTO product_variants ("productId", size, "colorName", "colorHex", sku, "priceAdjustment")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [prodId, s.size, s.color, s.hex, `TSH-006-${s.size}`, 0]
        );
      }
      console.log('Polera TSH-006 created successfully!');
    }
  }

  // Also check if Belt accessory exists or insert
  const beltCheck = await client.query(`SELECT id FROM products WHERE sku = 'ACC-007'`);
  if (beltCheck.rowCount === 0) {
    const catRes = await client.query(`SELECT id FROM categories LIMIT 1`);
    const seasonRes = await client.query(`SELECT id FROM seasons LIMIT 1`);
    const collRes = await client.query(`SELECT id FROM collections LIMIT 1`);
    const supRes = await client.query(`SELECT id FROM suppliers LIMIT 1`);

    if (catRes.rowCount > 0) {
      const catId = catRes.rows[0].id;
      const seasonId = seasonRes.rows[0].id;
      const collId = collRes.rows[0].id;
      const supId = supRes.rows[0].id;

      const newProd = await client.query(
        `INSERT INTO products (name, description, sku, "basePrice", "imagesJson", "arOverlayImageUrl", "arAnchorType", "isFeatured", "categoryId", "seasonId", "collectionId", "supplierId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          'Cinturón Reversible con Hebilla GG',
          'Cinturón en piel auténtica con detalle de tribanda verde y roja y hebilla dorada. Reversible para uso formal o casual.',
          'ACC-007',
          120.00,
          JSON.stringify(['/garments/belt.jpg']),
          '/garments/belt.jpg',
          'TORSO',
          true,
          catId,
          seasonId,
          collId,
          supId,
        ]
      );

      const prodId = newProd.rows[0].id;
      const sizes = [
        { size: '85', color: 'Negro / Verde-Rojo', hex: '#111827' },
        { size: '90', color: 'Negro / Verde-Rojo', hex: '#111827' },
        { size: '95', color: 'Negro / Verde-Rojo', hex: '#111827' },
      ];

      for (const s of sizes) {
        await client.query(
          `INSERT INTO product_variants ("productId", size, "colorName", "colorHex", sku, "priceAdjustment")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [prodId, s.size, s.color, s.hex, `ACC-007-${s.size}`, 0]
        );
      }
      console.log('Cinturón ACC-007 created successfully!');
    }
  }

  const updatedRows = await client.query(`SELECT id, name, sku, "imagesJson", "basePrice" FROM products`);
  console.log('Updated products:', updatedRows.rows);

  await client.end();
}

updateProducts().catch(console.error);
