// E-books functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const ebookCards = document.querySelectorAll('.ebook-card');

    // Initialize
    setupFilters();
    setupSearch();
    setupCartButtons();
    setupPreviewButtons();
    filterCards('all');

    // Filter system
    function setupFilters() {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active filter
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter cards
                const filter = this.dataset.filter;
                filterCards(filter);
            });
        });
    }

    // Search functionality
    function setupSearch() {
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                filterCards('all', searchTerm);
            });
        }
    }

    // Cart functionality
    function setupCartButtons() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('.add-to-cart')) {
                e.preventDefault();
                const button = e.target.closest('.add-to-cart');
                const ebookCard = button.closest('.ebook-card');
                
                if (button.classList.contains('added')) {
                    return;
                }

                addToCart(button, ebookCard);
            }

            if (e.target.closest('.buy-now')) {
                e.preventDefault();
                const button = e.target.closest('.buy-now');
                const ebookCard = button.closest('.ebook-card');
                buyNow(button, ebookCard);
            }
        });

        // Also handle global button clicks for backward compatibility
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        const buyNowButtons = document.querySelectorAll('.buy-now');

        addToCartButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (!this.classList.contains('added')) {
                    const ebookCard = this.closest('.ebook-card');
                    addToCart(this, ebookCard);
                }
            });
        });

        buyNowButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const ebookCard = this.closest('.ebook-card');
                buyNow(this, ebookCard);
            });
        });
    }

    // Add to cart function
    function addToCart(button, ebookCard) {
        const ebookData = extractEbookData(ebookCard);
        

        
        if (window.bibliotecaCart) {
            // Add loading state
            button.classList.add('loading');
            button.disabled = true;
            const originalHTML = button.innerHTML;
            const spanElement = button.querySelector('span');
            const originalText = spanElement ? spanElement.textContent : button.textContent;
            
            if (spanElement) {
                spanElement.textContent = 'Añadiendo...';
            } else {
                button.textContent = 'Añadiendo...';
            }
            
            // Simulate slight delay for better UX
            setTimeout(() => {
                const added = window.bibliotecaCart.addItem(ebookData);
                
                if (added) {
                    button.classList.remove('loading');
                    button.classList.add('added');
                    
                    if (spanElement) {
                        spanElement.textContent = 'En biblioteca ✓';
                    } else {
                        button.textContent = 'En biblioteca ✓';
                    }
                    
                    button.style.background = 'linear-gradient(145deg, #10b981 0%, #059669 50%, #10b981 100%)';
                    button.style.borderColor = '#10b981';
                    
                    // Show success animation
                    button.style.animation = 'successPulse 0.8s ease-out';
                } else {
                    // Reset button if already added
                    button.classList.remove('loading');
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }
            }, 500);
        } else {
            console.error('BibliotecaCart no está disponible');
            showNotification('Error: Sistema de carrito no disponible', 'error');
        }
    }

    // Buy now function
    function buyNow(button, ebookCard) {
        const ebookData = extractEbookData(ebookCard);
        
        if (window.bibliotecaCart) {
            // Add loading state
            button.classList.add('loading');
            button.disabled = true;
            const originalHTML = button.innerHTML;
            const spanElement = button.querySelector('span');
            
            if (spanElement) {
                spanElement.textContent = 'Procesando...';
            } else {
                button.innerHTML = '<span>Procesando...</span>';
            }
            
            const item = {
                id: ebookData.id,
                title: ebookData.title,
                price: parseFloat(ebookData.price),
                image: ebookData.image,
                imageAlt: ebookData.imageAlt
            };
            
            // Add slight delay for better UX
            setTimeout(() => {
                button.classList.remove('loading');
                button.disabled = false;
                button.innerHTML = originalHTML;
                
                window.bibliotecaCart.createPaymentSession([item], 'single');
            }, 800);
        } else {
            console.error('BibliotecaCart no está disponible');
            showNotification('Error: Sistema de pago no disponible', 'error');
        }
    }

    // Extract e-book data from card
    function extractEbookData(ebookCard) {
        const title = ebookCard.querySelector('h3').textContent;
        const description = ebookCard.querySelector('p').textContent;
        const category = ebookCard.querySelector('.ebook-category').textContent;
        const priceButton = ebookCard.querySelector('.add-to-cart');
        const price = priceButton.dataset.price;
        const id = priceButton.dataset.id;
        
        // Extraer información de la imagen
        const imageElement = ebookCard.querySelector('.ebook-cover, .ebook-image img, .ebook-image .ebook-cover, img');
        let imageUrl = null;
        let imageAlt = 'E-book cover';
        
        if (imageElement && imageElement.src && imageElement.style.display !== 'none') {
            imageUrl = imageElement.src;
            imageAlt = imageElement.alt || title;
        }
        

        
        return {
            id: id || 'ebook-' + Date.now(),
            title,
            description,
            category,
            price,
            image: imageUrl,
            imageAlt: imageAlt
        };
    }

    // Filter function
    function filterCards(filter, searchTerm = '') {
        ebookCards.forEach(card => {
            const category = card.dataset.category;
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            const matchesFilter = filter === 'all' || category === filter;
            const matchesSearch = !searchTerm || 
                title.includes(searchTerm) || 
                description.includes(searchTerm);
            
            if (matchesFilter && matchesSearch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Show notification function
    function showNotification(message, type = 'info') {
        // Use the cart's notification system if available
        if (window.bibliotecaCart && window.bibliotecaCart.showNotification) {
            window.bibliotecaCart.showNotification(message, type);
        } else {
            // Fallback to console or simple alert
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
});

// Global function for backward compatibility
window.addToCart = function(ebookElement) {
    const priceButton = ebookElement.querySelector('.add-to-cart');
    const price = priceButton ? priceButton.dataset.price : null;
    
    if (!price) {
        console.error('No se pudo encontrar el precio del producto');
        return false;
    }

    const item = {
        id: priceButton.dataset.id || 'ebook-' + Date.now(),
        title: ebookElement.querySelector('h3').textContent,
        description: ebookElement.querySelector('p').textContent,
        category: ebookElement.querySelector('.ebook-category').textContent,
        price: price
    };
    
    if (window.bibliotecaCart) {
        return window.bibliotecaCart.addItem(item);
    }
    
    return false;
};

// Preview functionality
function setupPreviewButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.quick-preview')) {
            e.preventDefault();
            const button = e.target.closest('.quick-preview');
            const ebookId = button.dataset.id;
            showPreview(ebookId);
        }
    });
}

// Show preview modal
function showPreview(ebookId) {
    const previews = {
        'aprende-ia': {
            title: 'Aprende a utilizar la IA',
            subtitle: 'Aprende a rentabilizar las inteligencias artificiales',
            preview: 'Capítulo 1: Introducción a la Inteligencia Artificial\n\nLa inteligencia artificial ha dejado de ser ciencia ficción para convertirse en una realidad tangible que está transformando todos los aspectos de nuestras vidas profesionales y personales.\n\nEn este libro aprenderás:\n• Fundamentos de la IA y machine learning\n• Cómo identificar oportunidades de negocio\n• Herramientas prácticas para implementar IA\n• Casos de éxito reales\n• Estrategias de monetización\n\n"El futuro pertenece a aquellos que comprenden y aprovechan el poder de la inteligencia artificial."'
        }
    };

    const previewData = previews[ebookId];
    if (previewData) {
        const modal = createPreviewModal(previewData);
        document.body.appendChild(modal);
        
        // Close modal functionality
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('close-preview')) {
                modal.remove();
            }
        });
    }
}

// Create preview modal
function createPreviewModal(data) {
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
        <div class="preview-content">
            <button class="close-preview">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
            </button>
            <div class="preview-header">
                <h3>${data.title}</h3>
                <p class="preview-subtitle">${data.subtitle}</p>
            </div>
            <div class="preview-body">
                <h4>Vista previa del contenido:</h4>
                <div class="preview-text">${data.preview.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="preview-footer">
                <button class="btn btn-primary" onclick="this.closest('.preview-modal').remove()">
                    Cerrar vista previa
                </button>
            </div>
        </div>
    `;
    return modal;
}

// Ensure cart is initialized when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart if not already done
    if (typeof BibliotecaCart !== 'undefined' && !window.bibliotecaCart) {
        window.bibliotecaCart = new BibliotecaCart();
    }
}); 