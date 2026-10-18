
const API_URL = "/api/products";

// Get HTML elements
const productForm = document.getElementById("productForm");
const productTable = document.getElementById("productTable");
const productCount = document.getElementById("productCount");
const message = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

// Display a message to the user
function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = type;
}

// Send requests to the API
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || data.message || "Something went wrong.");
    }

    return data;
}

// Load and display all products
async function loadProducts() {
    productTable.innerHTML = `
        <tr>
            <td colspan="8">Loading products...</td>
        </tr>
    `;

    try {
        const products = await apiRequest(API_URL);

        productTable.innerHTML = "";
        productCount.textContent = products.length;

        if (products.length === 0) {
            productTable.innerHTML = `
                <tr>
                    <td colspan="8">No products found. Add a product above.</td>
                </tr>
            `;
            return;
        }

        products.forEach((product) => {
            const row = document.createElement("tr");

            // Safely display product information
            const values = [
                product.id,
                product.product_name,
                product.brand,
                product.category,
                Number(product.price).toFixed(2),
                product.stock_quantity,
                product.description || "No description"
            ];

            values.forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            // Create the Actions cell
            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "edit";
            editButton.addEventListener("click", () => {
                editProduct(product);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete";
            deleteButton.addEventListener("click", () => {
                deleteProduct(product.id);
            });

            actionsCell.append(editButton, deleteButton);
            row.appendChild(actionsCell);
            productTable.appendChild(row);
        });
    } catch (error) {
        productTable.innerHTML = `
            <tr>
                <td colspan="8">Could not load products.</td>
            </tr>
        `;
        showMessage(error.message, "error");
    }
}

// Add or update a product
productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("productId").value;

    const product = {
        product_name: document.getElementById("product_name").value.trim(),
        brand: document.getElementById("brand").value.trim(),
        category: document.getElementById("category").value,
        price: Number(document.getElementById("price").value),
        stock_quantity: Number(
            document.getElementById("stock_quantity").value
        ),
        description: document.getElementById("description").value.trim()
    };

    // Basic input validation
    if (
        !product.product_name ||
        !product.brand ||
        !product.category ||
        document.getElementById("price").value === "" ||
        document.getElementById("stock_quantity").value === "" ||
        !Number.isFinite(product.price) ||
        product.price < 0 ||
        !Number.isInteger(product.stock_quantity) ||
        product.stock_quantity < 0
    ) {
        showMessage(
            "Please enter valid product details.",
            "error"
        );
        return;
    }

    try {
        if (id) {
            // Update an existing product (PUT)
            await apiRequest(`${API_URL}/${id}`, {
                method: "PUT",
                body: JSON.stringify(product)
            });

            showMessage("Product updated successfully.", "success");
        } else {
            // Add a new product (POST)
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(product)
            });

            showMessage("Product added successfully.", "success");
        }

        resetForm();
        await loadProducts();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

// Fill the form when Edit is clicked
function editProduct(product) {
    document.getElementById("productId").value = product.id;
    document.getElementById("product_name").value = product.product_name;
    document.getElementById("brand").value = product.brand;
    document.getElementById("category").value = product.category;
    document.getElementById("price").value = product.price;
    document.getElementById("stock_quantity").value =
        product.stock_quantity;
    document.getElementById("description").value =
        product.description || "";

    formTitle.textContent = "Edit Product";
    saveButton.textContent = "Update Product";
    cancelButton.hidden = false;

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Delete a product
async function deleteProduct(id) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        showMessage("Product deleted successfully.", "success");
        await loadProducts();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

// Clear the form and return to Add Product mode
function resetForm() {
    productForm.reset();
    document.getElementById("productId").value = "";

    formTitle.textContent = "Add New Product";
    saveButton.textContent = "Save Product";
    cancelButton.hidden = true;
}

// Cancel editing
cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("", "success");
});

// Load products when the page opens
loadProducts();
