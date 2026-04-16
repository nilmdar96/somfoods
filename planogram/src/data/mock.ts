import type { Product, Fixture } from "@/types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Pepsi 500ml",
    width: 6,
    height: 22,
    depth: 6,
    color: "#0A3D91",
    imageUrl: "/images/pepsi-500ml.svg",
    category: "Beverages",
    salesVelocity: 120,
    profitMargin: 1.5,
  },
  {
    id: "prod-002",
    name: "Lay's Magic Masala",
    width: 18,
    height: 28,
    depth: 8,
    color: "#F7C823",
    imageUrl: "/images/lays-magic-masala.svg",
    category: "Snacks",
    salesVelocity: 95,
    profitMargin: 2.2,
  },
  {
    id: "prod-003",
    name: "Kurkure Masala Munch",
    width: 18,
    height: 28,
    depth: 8,
    color: "#E64A19",
    imageUrl: "/images/kurkure-masala-munch.svg",
    category: "Snacks",
    salesVelocity: 110,
    profitMargin: 1.9,
  },
  {
    id: "prod-004",
    name: "Tropicana Slice Mango",
    width: 7,
    height: 18,
    depth: 7,
    color: "#F59E0B",
    imageUrl: "/images/tropicana-slice-mango.svg",
    category: "Juices",
    salesVelocity: 85,
    profitMargin: 1.7,
  },
  {
    id: "prod-005",
    name: "Mountain Dew 500ml",
    width: 6,
    height: 22,
    depth: 6,
    color: "#1F8F2F",
    imageUrl: "/images/mountain-dew-500ml.svg",
    category: "Beverages",
    salesVelocity: 105,
    profitMargin: 1.8,
  },
];

export const MOCK_FIXTURE: Fixture = {
  id: "fixture-001",
  name: "Gondola Unit A",
  width: 120,   // 120 cm wide
  height: 180,  // 180 cm tall
  depth: 45,    // 45 cm deep
  shelves: [
    {
      id: "shelf-001",
      y_offset: 0,
      width: 120,
      height: 40,    // 40cm clearance
      max_weight: 50,
    },
    {
      id: "shelf-002",
      y_offset: 40,
      width: 120,
      height: 40,
      max_weight: 50,
    },
    {
      id: "shelf-003",
      y_offset: 80,
      width: 120,
      height: 45,
      max_weight: 40,
    },
    {
      id: "shelf-004",
      y_offset: 125,
      width: 120,
      height: 55,
      max_weight: 30,
    },
  ],
};
