import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; 

function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name ?? "").trim();
  const rawPassword = String(password ?? "");

  try {
    if (!normalizedName) return res.status(400).json({ message: "Name is required" });
    if (!normalizedEmail) return res.status(400).json({ message: "Email is required" });
    if (rawPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, password: hashedPassword },
    });

    res.json({ message: "User registered", userId: user.id });
  } catch (err) {
    res.status(500).json({
      message: "Registration failed (database connection issue). Check DATABASE_URL.",
    });
  }
};




export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const rawPassword = String(password ?? "");

  try {
    if (!normalizedEmail) return res.status(400).json({ message: "Email is required" });
    if (!rawPassword) return res.status(400).json({ message: "Password is required" });

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(rawPassword, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({
      message: "Login failed (database connection issue). Check DATABASE_URL.",
    });
  }
};
