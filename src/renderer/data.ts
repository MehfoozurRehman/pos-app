import { faker } from '@faker-js/faker';

export const shops = [
  {
    id: 'shop_1',
    shopId: faker.string.uuid(),
    owner: faker.person.fullName(),
    name: faker.company.name(),
    logo: faker.image.avatar(),
    location: faker.location.city(),
    password: faker.internet.password(),
    lastLogin: faker.date.recent().toISOString(),
  },
];

export const payments = Array.from({ length: 3 }, () => ({
  id: faker.string.uuid(),
  shop: 'shop_1',
  month: faker.date.month(),
  year: String(faker.date.past().getFullYear()),
}));

export const products = Array.from({ length: 10 }, (_, i) => ({
  id: `product_${i + 1}`,
  shop: 'shop_1',
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  categories: faker.helpers.arrayElements(['Electronics', 'Clothing', 'Groceries', 'Books', 'Beauty'], { min: 1, max: 3 }),
  picture: faker.image.urlPicsumPhotos(),
  averagePrice: Number(faker.commerce.price()),
}));

export const inventory = products.map((product) => ({
  id: faker.string.uuid(),
  product: product.id,
  barcode: faker.string.alphanumeric(12),
  actualPrice: Number(faker.commerce.price()),
  sellingPrice: Number(faker.commerce.price()),
}));

export const orders = Array.from({ length: 5 }, () => ({
  id: faker.string.uuid(),
  orderId: `#${faker.string.numeric(5)}`,
  shop: 'shop_1',
  status: faker.helpers.arrayElement(['pending', 'completed', 'cancelled']),
  customerName: faker.person.fullName(),
  customerPhone: faker.phone.number(),
  createdAt: faker.date.past().toISOString(),
  items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    product: faker.helpers.arrayElement(products).id,
    barcode: faker.string.alphanumeric(12),
    discount: faker.datatype.boolean() ? Number(faker.commerce.price()) : undefined,
  })),
  discount: faker.datatype.boolean() ? Number(faker.commerce.price()) : undefined,
}));
