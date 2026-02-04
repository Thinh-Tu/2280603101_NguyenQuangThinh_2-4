// Fetch data from db.json
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = null;
let sortDirection = 'asc'; // 'asc' or 'desc'
let currentDetailProduct = null;
let isEditMode = false;

const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

async function loadProducts() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const table = document.getElementById('productTable');

    try {
        // Fetch data from db.json
        const response = await fetch('./db.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        allProducts = products;
        filteredProducts = products;
        
        // Clear loading message
        loadingDiv.style.display = 'none';
        
        // Check if products exist
        if (!products || products.length === 0) {
            errorDiv.textContent = 'Không tìm thấy sản phẩm nào!';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Display first page
        currentPage = 1;
        displayPaginatedProducts();
        updatePaginationUI();
        
        // Show table
        table.style.display = 'table';
        
        console.log(`Đã tải ${products.length} sản phẩm thành công!`);
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        loadingDiv.style.display = 'none';
        errorDiv.textContent = `Lỗi: ${error.message}. Vui lòng kiểm tra file db.json hoặc kết nối.`;
        errorDiv.style.display = 'block';
    }
}

function displayProducts(products) {
    const tableBody = document.getElementById('tableBody');
    const table = document.getElementById('productTable');
    const noResults = document.getElementById('noResults');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are products to display
    if (!products || products.length === 0) {
        if (!noResults) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.id = 'noResults';
            noResultsDiv.className = 'no-results';
            noResultsDiv.textContent = 'Không tìm thấy sản phẩm phù hợp';
            table.parentElement.appendChild(noResultsDiv);
        } else {
            noResults.style.display = 'block';
        }
        table.style.display = 'none';
        return;
    }
    
    if (noResults) {
        noResults.style.display = 'none';
    }
    table.style.display = 'table';
    
    // Populate table with products
    products.forEach(product => {
        const row = document.createElement('tr');
        row.classList.add('product-row');
        
        // Get the first image, if available
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://via.placeholder.com/80?text=No+Image';
        
        // Get category name
        const categoryName = product.category && product.category.name 
            ? product.category.name 
            : 'N/A';
        
        // Get description or use default text
        const description = product.description || 'Không có mô tả';
        
        row.innerHTML = `
            <td><span class="id-badge">${product.id}</span></td>
            <td>
                <img src="${imageUrl}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/80?text=Image'">
            </td>
            <td>
                <strong>${product.title}</strong>
                <div class="description-tooltip"><strong>Mô tả:</strong> ${description}</div>
            </td>
            <td>
                <span class="price-highlight">$${product.price}</span>
            </td>
            <td>
                <span class="category-badge">${categoryName}</span>
            </td>
        `;
        
        // Add click event to open detail modal
        row.addEventListener('click', () => openDetailModal(product));
        
        tableBody.appendChild(row);
    });
}

function filterProducts(searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    filteredProducts = allProducts.filter(product => 
        product.title.toLowerCase().includes(lowerSearchTerm)
    );
    
    // Reset to first page when filtering
    currentPage = 1;
    displayPaginatedProducts();
    updatePaginationUI();
}

function sortBy(field) {
    // If clicking the same field, toggle direction
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    
    // Sort the filtered products
    filteredProducts.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle numeric values (price)
        if (field === 'price') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        // Handle string values (title)
        if (field === 'title') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    // Update UI
    updateSortButtons();
    currentPage = 1;
    displayPaginatedProducts();
    updatePaginationUI();
}

function updateSortButtons() {
    const sortTitleBtn = document.getElementById('sortTitle');
    const sortPriceBtn = document.getElementById('sortPrice');
    
    // Remove active class from all sort buttons
    sortTitleBtn.classList.remove('active');
    sortPriceBtn.classList.remove('active');
    
    // Add active class and update icon
    if (sortField === 'title') {
        sortTitleBtn.classList.add('active');
        sortTitleBtn.textContent = sortDirection === 'asc' ? '↑' : '↓';
    } else if (sortField === 'price') {
        sortPriceBtn.classList.add('active');
        sortPriceBtn.textContent = sortDirection === 'asc' ? '↑' : '↓';
    }
}

function displayPaginatedProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);
    
    displayProducts(productsToDisplay);
}

function updatePaginationUI() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    
    // Hide pagination if no products or only one page
    if (filteredProducts.length === 0 || totalPages === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Update pagination info
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('totalItems').textContent = filteredProducts.length;
    
    // Update prev/next buttons
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
    
    // Generate page number buttons
    const pageNumbersDiv = document.getElementById('pageNumbers');
    pageNumbersDiv.innerHTML = '';
    
    // Show max 5 page buttons at a time
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (endPage - startPage < 5) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    // Add first page button if needed
    if (startPage > 1) {
        const btn = createPageButton(1, currentPage === 1);
        pageNumbersDiv.appendChild(btn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '8px 5px';
            pageNumbersDiv.appendChild(dots);
        }
    }
    
    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const btn = createPageButton(i, i === currentPage);
        pageNumbersDiv.appendChild(btn);
    }
    
    // Add last page button if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '8px 5px';
            pageNumbersDiv.appendChild(dots);
        }
        const btn = createPageButton(totalPages, currentPage === totalPages);
        pageNumbersDiv.appendChild(btn);
    }
}

function createPageButton(pageNum, isActive) {
    const btn = document.createElement('button');
    btn.textContent = pageNum;
    btn.onclick = () => goToPage(pageNum);
    if (isActive) {
        btn.classList.add('active');
    }
    return btn;
}

function nextPage() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPaginatedProducts();
        updatePaginationUI();
        window.scrollTo(0, 0);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPaginatedProducts();
        updatePaginationUI();
        window.scrollTo(0, 0);
    }
}

function goToPage(pageNum) {
    currentPage = pageNum;
    displayPaginatedProducts();
    updatePaginationUI();
    window.scrollTo(0, 0);
}

function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterProducts(e.target.value);
        });
    }
}

function setupItemsPerPageListener() {
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            displayPaginatedProducts();
            updatePaginationUI();
        });
    }
}

function exportToCSV() {
    // Get the current products being displayed (from current page)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToExport = filteredProducts.slice(startIndex, endIndex);
    
    if (productsToExport.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    
    // Prepare CSV headers
    const headers = ['ID', 'Tên sản phẩm', 'Giá', 'Danh mục', 'Mô tả'];
    
    // Prepare CSV rows
    const rows = productsToExport.map(product => [
        product.id,
        `"${product.title.replace(/"/g, '""')}"`, // Escape quotes
        product.price,
        product.category && product.category.name ? product.category.name : 'N/A',
        `"${(product.description || 'Không có mô tả').replace(/"/g, '""')}"` // Escape quotes
    ]);
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Add UTF-8 BOM for Excel compatibility with Vietnamese characters
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with current date and time
    const now = new Date();
    const filename = `products_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Đã xuất ${productsToExport.length} sản phẩm ra file CSV: ${filename}`);
}

function openDetailModal(product) {
    currentDetailProduct = product;
    isEditMode = false;
    
    // Populate modal with product data
    document.getElementById('modalTitle').textContent = product.title;
    document.getElementById('detailId').textContent = product.id;
    document.getElementById('detailTitle').textContent = product.title;
    document.getElementById('detailPrice').textContent = `$${product.price}`;
    document.getElementById('detailCategory').textContent = product.category && product.category.name ? product.category.name : 'N/A';
    document.getElementById('detailDescription').textContent = product.description || 'Không có mô tả';
    
    // Set image
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/400?text=No+Image';
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalImage').onerror = function() {
        this.src = 'https://via.placeholder.com/400?text=Image';
    };
    
    // Set input values
    document.getElementById('inputTitle').value = product.title;
    document.getElementById('inputPrice').value = product.price;
    document.getElementById('inputDescription').value = product.description || '';
    
    // Show modal
    const modal = document.getElementById('detailModal');
    modal.classList.add('show');
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    // Hide success message
    document.getElementById('successMessage').classList.remove('show');
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('show');
    isEditMode = false;
    exitEditMode();
    
    // Enable body scroll
    document.body.style.overflow = '';
}

function closeDetailModalOnBackdrop(event) {
    // Only close if clicking on the backdrop itself, not on the modal content
    if (event.target.id === 'detailModal') {
        closeDetailModal();
    }
}

function enterEditMode() {
    isEditMode = true;
    
    // Show/hide buttons
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'block';
    document.getElementById('cancelBtn').style.display = 'block';
    
    // Add edit-mode class to modal-body
    const modalBody = document.querySelector('.modal-body');
    modalBody.classList.add('edit-mode');
}

function exitEditMode() {
    isEditMode = false;
    
    // Show/hide buttons
    document.getElementById('editBtn').style.display = 'block';
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    
    // Remove edit-mode class from modal-body
    const modalBody = document.querySelector('.modal-body');
    modalBody.classList.remove('edit-mode');
}

function cancelEdit() {
    exitEditMode();
    
    // Reset input values to original
    if (currentDetailProduct) {
        document.getElementById('inputTitle').value = currentDetailProduct.title;
        document.getElementById('inputPrice').value = currentDetailProduct.price;
        document.getElementById('inputDescription').value = currentDetailProduct.description || '';
    }
}

function saveChanges() {
    if (!currentDetailProduct) return;
    
    // Get updated values
    const updatedTitle = document.getElementById('inputTitle').value.trim();
    const updatedPrice = parseFloat(document.getElementById('inputPrice').value);
    const updatedDescription = document.getElementById('inputDescription').value.trim();
    
    // Validate
    if (!updatedTitle) {
        alert('Tên sản phẩm không được để trống!');
        return;
    }
    
    if (isNaN(updatedPrice) || updatedPrice <= 0) {
        alert('Giá phải là số dương!');
        return;
    }
    
    // Prepare updated product
    const updatedProduct = {
        ...currentDetailProduct,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        updatedAt: new Date().toISOString()
    };
    
    // Send API request to update product
    updateProductAPI(updatedProduct);
}

function updateProductAPI(updatedProduct) {
    // Try to update via API endpoint
    const apiUrl = `https://api.escuelajs.co/api/v1/products/${updatedProduct.id}`;
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: updatedProduct.title,
            price: updatedProduct.price,
            description: updatedProduct.description
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Sản phẩm đã được cập nhật:', data);
        
        // Update local data
        currentDetailProduct = updatedProduct;
        const productIndex = allProducts.findIndex(p => p.id === updatedProduct.id);
        if (productIndex !== -1) {
            allProducts[productIndex] = updatedProduct;
        }
        
        // Refresh filtered products if they contain this product
        const filteredIndex = filteredProducts.findIndex(p => p.id === updatedProduct.id);
        if (filteredIndex !== -1) {
            filteredProducts[filteredIndex] = updatedProduct;
        }
        
        // Refresh display
        displayPaginatedProducts();
        
        // Update modal display
        document.getElementById('detailTitle').textContent = updatedProduct.title;
        document.getElementById('detailPrice').textContent = `$${updatedProduct.price}`;
        document.getElementById('detailDescription').textContent = updatedProduct.description || 'Không có mô tả';
        
        // Exit edit mode and show success message
        exitEditMode();
        const successMsg = document.getElementById('successMessage');
        successMsg.classList.add('show');
        
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
        
    })
    .catch(error => {
        console.error('Lỗi khi cập nhật:', error);
        alert(`Lỗi: ${error.message}`);
    });
}

function openCreateModal() {
    // Clear form
    document.getElementById('createTitle').value = '';
    document.getElementById('createPrice').value = '';
    document.getElementById('createDescription').value = '';
    document.getElementById('createCategoryId').value = '1';
    document.getElementById('createImage').value = '';
    
    // Clear messages
    document.getElementById('createSuccessMessage').classList.remove('show');
    document.getElementById('createErrorMessage').classList.remove('show');
    document.getElementById('createErrorMessage').textContent = '';
    
    // Show modal
    const modal = document.getElementById('createModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function closeCreateModalOnBackdrop(event) {
    if (event.target.id === 'createModal') {
        closeCreateModal();
    }
}

function submitCreateProduct() {
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imageUrl = document.getElementById('createImage').value.trim();
    
    // Validation
    const errorMsg = document.getElementById('createErrorMessage');
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
    
    if (!title) {
        errorMsg.textContent = '❌ Tên sản phẩm không được để trống!';
        errorMsg.classList.add('show');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        errorMsg.textContent = '❌ Giá phải là số dương!';
        errorMsg.classList.add('show');
        return;
    }
    
    if (isNaN(categoryId) || categoryId <= 0) {
        errorMsg.textContent = '❌ Danh mục ID không hợp lệ!';
        errorMsg.classList.add('show');
        return;
    }
    
    // Create product object
    const newProduct = {
        title: title,
        price: price,
        description: description,
        categoryId: categoryId,
        images: imageUrl ? [imageUrl] : ['https://via.placeholder.com/300?text=No+Image']
    };
    
    // Call API
    createProductAPI(newProduct);
}

function createProductAPI(newProduct) {
    const apiUrl = `${API_BASE_URL}/products`;
    
    // Show loading state
    const submitBtn = document.querySelector('#createModal .btn-save');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Đang tạo...';
    submitBtn.disabled = true;
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Sản phẩm mới được tạo:', data);
        
        // Add to local data
        allProducts.unshift(data);
        filteredProducts.unshift(data);
        
        // Reset pagination
        currentPage = 1;
        displayPaginatedProducts();
        updatePaginationUI();
        
        // Show success message
        const successMsg = document.getElementById('createSuccessMessage');
        successMsg.classList.add('show');
        
        // Reset form
        document.getElementById('createTitle').value = '';
        document.getElementById('createPrice').value = '';
        document.getElementById('createDescription').value = '';
        document.getElementById('createCategoryId').value = '1';
        document.getElementById('createImage').value = '';
        
        // Close modal after 2 seconds
        setTimeout(() => {
            closeCreateModal();
            successMsg.classList.remove('show');
        }, 2000);
        
    })
    .catch(error => {
        console.error('Lỗi khi tạo sản phẩm:', error);
        const errorMsg = document.getElementById('createErrorMessage');
        errorMsg.textContent = `❌ Lỗi: ${error.message}`;
        errorMsg.classList.add('show');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Load products when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupSearchListener();
    setupItemsPerPageListener();
});
