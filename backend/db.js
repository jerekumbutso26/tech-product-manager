const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const databasePath = path.resolve(
    process.cwd(),
    process.env.DB_PATH || "./database/products.db"
);

fs.mkdirSync(path.dirname(databasePath), {
    recursive: true
});

const db = new sqlite3.Database(databasePath);

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) reject(error);
            else resolve({
                id: this.lastID,
                changes: this.changes
            });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (error, row) => {
            if (error) reject(error);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
}

async function initializeDatabase() {
    const schema = fs.readFileSync(
        path.join(__dirname, "schema.sql"),
        "utf8"
    );

    await new Promise((resolve, reject) => {
        db.exec(schema, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });

    const result = await get(
        "SELECT COUNT(*) AS total FROM products"
    );

    if (result.total === 0) {
        const products = [
            ["ThinkPad E14", "Lenovo", "Laptop", 9500, 8, "Business laptop"],
            ["MacBook Air", "Apple", "Laptop", 18000, 5, "Lightweight laptop"],
            ["Galaxy S24", "Samsung", "Smartphone", 12000, 10, "Android phone"],
            ["iPhone 15", "Apple", "Smartphone", 14500, 7, "Apple smartphone"],
            ["Sony WH-1000XM5", "Sony", "Headphones", 4500, 12, "Noise-cancelling headphones"],
            ["Redmi Buds 5", "Xiaomi", "Earbuds", 850, 20, "Wireless earbuds"],
            ["iPad Air", "Apple", "Tablet", 11000, 6, "Portable tablet"],
            ["MX Master 3S", "Logitech", "Mouse", 1800, 15, "Wireless mouse"],
            ["Dell U2723QE", "Dell", "Monitor", 7800, 4, "27-inch monitor"],
            ["Samsung T7", "Samsung", "Storage", 2200, 9, "Portable SSD"]
        ];

        for (const product of products) {
            await run(
                `INSERT INTO products
                (product_name, brand, category, price,
                 stock_quantity, description)
                VALUES (?, ?, ?, ?, ?, ?)`,
                product
            );
        }

        console.log("10 sample products inserted.");
    }

    console.log("Database initialized.");
}

module.exports = {
    db,
    run,
    get,
    all,
    initializeDatabase
};