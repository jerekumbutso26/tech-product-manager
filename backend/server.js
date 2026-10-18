
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Frontend directory — declare this only once
const FRONTEND_PATH = path.resolve(__dirname, "..", "frontend");

// Middleware
app.use(express.json());

// Serve HTML, CSS, JavaScript and other frontend files
app.use(express.static(FRONTEND_PATH));

// ============================================
// PRODUCT VALIDATION
// ============================================

function validateProduct(body) {
    const {
        product_name,
        brand,
        category,
        price,
        stock_quantity,
        description
    } = body;

    if (
        typeof product_name !== "string" ||
        !product_name.trim() ||
        typeof brand !== "string" ||
        !brand.trim() ||
        typeof category !== "string" ||
        !category.trim()
    ) {
        return "Product name, brand and category are required.";
    }

    if (
        price === "" ||
        price === null ||
        price === undefined ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
    ) {
        return "Price must be a valid non-negative number.";
    }

    if (
        stock_quantity === "" ||
        stock_quantity === null ||
        stock_quantity === undefined ||
        !Number.isInteger(Number(stock_quantity)) ||
        Number(stock_quantity) < 0
    ) {
        return "Stock quantity must be a non-negative whole number.";
    }

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        return "Description must be text.";
    }

    return null;
}

function validId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

// ============================================
// GET ALL PRODUCTS
// ============================================

app.get("/api/products", async (req, res) => {
    try {
        const products = await db.all(
            "SELECT * FROM products ORDER BY id DESC"
        );

        res.json(products);
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({
            error: "Failed to retrieve products."
        });
    }
});

// ============================================
// GET ONE PRODUCT
// ============================================

app.get("/api/products/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid product ID."
        });
    }

    try {
        const product = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [Number(req.params.id)]
        );

        if (!product) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        res.json(product);
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({
            error: "Failed to retrieve product."
        });
    }
});

// ============================================
// CREATE PRODUCT
// ============================================

app.post("/api/products", async (req, res) => {
    const validationError = validateProduct(req.body);

    if (validationError) {
        return res.status(400).json({
            error: validationError
        });
    }

    const {
        product_name,
        brand,
        category,
        price,
        stock_quantity,
        description = ""
    } = req.body;

    try {
        const result = await db.run(
            `INSERT INTO products
            (product_name, brand, category, price,
             stock_quantity, description)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                product_name.trim(),
                brand.trim(),
                category.trim(),
                Number(price),
                Number(stock_quantity),
                description
            ]
        );

        const product = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [result.lastID]
        );

        res.status(201).json(product);
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({
            error: "Failed to create product."
        });
    }
});

// ============================================
// UPDATE PRODUCT
// ============================================

app.put("/api/products/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid product ID."
        });
    }

    const validationError = validateProduct(req.body);

    if (validationError) {
        return res.status(400).json({
            error: validationError
        });
    }

    const {
        product_name,
        brand,
        category,
        price,
        stock_quantity,
        description = ""
    } = req.body;

    try {
        const existing = await db.get(
            "SELECT id FROM products WHERE id = ?",
            [Number(req.params.id)]
        );

        if (!existing) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        await db.run(
            `UPDATE products
             SET product_name = ?,
                 brand = ?,
                 category = ?,
                 price = ?,
                 stock_quantity = ?,
                 description = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                product_name.trim(),
                brand.trim(),
                category.trim(),
                Number(price),
                Number(stock_quantity),
                description,
                Number(req.params.id)
            ]
        );

        const updatedProduct = await db.get(
            "SELECT * FROM products WHERE id = ?",
            [Number(req.params.id)]
        );

        res.json(updatedProduct);
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({
            error: "Failed to update product."
        });
    }
});

// ============================================
// DELETE PRODUCT
// ============================================

app.delete("/api/products/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({
            error: "Invalid product ID."
        });
    }

    try {
        const result = await db.run(
            "DELETE FROM products WHERE id = ?",
            [Number(req.params.id)]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        res.json({
            message: "Product deleted successfully.",
            id: Number(req.params.id)
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({
            error: "Failed to delete product."
        });
    }
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    try {
        if (!fs.existsSync(FRONTEND_PATH)) {
            throw new Error(
                `Frontend folder not found: ${FRONTEND_PATH}`
            );
        }

        if (!fs.existsSync(path.join(FRONTEND_PATH, "index.html"))) {
            throw new Error("frontend/index.html was not found.");
        }

        if (!fs.existsSync(path.join(FRONTEND_PATH, "style.css"))) {
            throw new Error("frontend/style.css was not found.");
        }

        await db.initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Frontend folder: ${FRONTEND_PATH}`);
            console.log(`CSS available at http://localhost:${PORT}/style.css`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
