import { NextResponse } from "next/server";

const MENU_ITEMS = [
  {
    id: "1",
    name: "The Dough Whole Jar",
    category: "Specialty Shakes",
    price: 16.99,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop",
    description: "Cookie dough rim, chocolate drizzle, topped with a mini chocolate chip cookie setup."
  },
  {
    id: "2",
    name: "Unicorn Milkshake",
    category: "Specialty Shakes",
    price: 15.99,
    image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop",
    description: "Cotton candy drizzle, marshmallow cream, rainbow sprinkles."
  },
  {
    id: "3",
    name: "Edible Cookie Dough Scoop",
    category: "Edible Dough",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
    description: "Safe to eat raw cookie dough with chocolate chips."
  }
];

export async function GET() {
  return NextResponse.json(MENU_ITEMS);
}