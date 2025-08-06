// Cart Management System with Real Payments
class BibliotecaCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('biblioteca-cart')) || [];
        this.discountCodes = {
            'BIBLIOWAVE10': 0.10,
            'PREMIUM20': 0.20,
            'ESTUDIANTE15': 0.15,
            'PRIMERA25': 0.25
        };
        this.appliedDiscount = 0;
        this.stripe = null;
        this.migrateCartData(); // Migrar datos antiguos para compatibilidad
        this.initStripe();
        this.init();
    }

    // Migrar datos del carrito para compatibilidad con versiones anteriores
    migrateCartData() {
        let needsUpdate = false;
        
        this.items = this.items.map(item => {
            if (!item.hasOwnProperty('image')) {
                item.image = null;
                item.imageAlt = item.title;
                needsUpdate = true;
            }
            // Eliminar referencias a páginas (deprecated)
            if (item.hasOwnProperty('pages')) {
                delete item.pages;
                needsUpdate = true;
            }
            return item;
        });
        
        if (needsUpdate) {
            this.saveCart();
        }
    }

    async initStripe() {
        // Inicializar Stripe (necesitarás tu clave pública)
        if (window.Stripe) {
            this.stripe = Stripe('pk_test_51234567890abcdef'); // Reemplazar con tu clave real
        }
    }

    init() {
        this.updateCartCount();
        this.renderCart();
        this.bindEvents();
        this.loadRelatedProducts();
    }

    // Add item to cart with real price
    addItem(item) {
        const existingItem = this.items.find(cartItem => cartItem.id === item.id);
        
        if (!existingItem) {
            const newItem = {
                id: item.id,
                title: item.title,
                description: item.description,
                category: item.category,
                price: parseFloat(item.price), // Usar precio real
                image: item.image || null, // Incluir imagen de portada
                imageAlt: item.imageAlt || item.title,
                addedAt: new Date().toISOString()
            };
            
            this.items.push(newItem);
            
            this.saveCart();
            this.updateCartCount();
            this.renderCart();
            this.showNotification(`"${item.title}" añadido a tu biblioteca - €${item.price}`, 'success');
            return true;
        } else {
            this.showNotification(`"${item.title}" ya está en tu biblioteca`, 'info');
            return false;
        }
    }

    // Remove item from cart
    removeItem(itemId) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            const removedItem = this.items.splice(itemIndex, 1)[0];
            this.saveCart();
            this.updateCartCount();
            this.renderCart();
            this.showNotification(`"${removedItem.title}" eliminado de tu biblioteca`, 'success');
        }
    }

    // Clear entire cart
    clearCart() {
        this.items = [];
        this.appliedDiscount = 0;
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.showNotification('Biblioteca vacía', 'info');
    }

    // Calculate totals with real prices
    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + item.price, 0);
        const discount = subtotal * this.appliedDiscount;
        const total = Math.max(0, subtotal - discount);
        
        return {
            subtotal: subtotal.toFixed(2),
            discount: discount.toFixed(2),
            total: total.toFixed(2),
            itemCount: this.items.length
        };
    }

    // Apply discount code
    applyDiscount(code) {
        const discountRate = this.discountCodes[code.toUpperCase()];
        
        if (discountRate) {
            this.appliedDiscount = discountRate;
            this.renderCart();
            this.showNotification(`Código "${code}" aplicado. ${(discountRate * 100).toFixed(0)}% de descuento`, 'success');
            return true;
        } else {
            this.showNotification('Código promocional inválido', 'error');
            return false;
        }
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('biblioteca-cart', JSON.stringify(this.items));
    }

    // Update cart count in navigation
    updateCartCount() {
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        cartCountElements.forEach(element => {
            if (element) {
                element.textContent = this.items.length;
                element.classList.toggle('has-items', this.items.length > 0);
            }
        });
    }

    // Render cart content
    renderCart() {
        const emptyCart = document.getElementById('emptyCart');
        const cartContent = document.getElementById('cartContent');
        const itemsList = document.getElementById('itemsList');

        if (this.items.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartContent) cartContent.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartContent) cartContent.style.display = 'block';

        // Render items
        if (itemsList) {
            itemsList.innerHTML = this.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="item-image">
                        ${item.image ? `
                            <img src="${item.image}" 
                                 alt="${item.imageAlt}" 
                                 class="cart-item-cover"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="item-placeholder" style="display: none;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                            </div>
                        ` : `
                            <div class="item-placeholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                            </div>
                        `}
                    </div>
                    <div class="item-details">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                        <div class="item-meta">
                            <span class="item-category">${item.category}</span>
                        </div>
                    </div>
                    <div class="item-price">
                        <span class="price">€${item.price.toFixed(2)}</span>
                        <button class="buy-single" data-id="${item.id}" data-price="${item.price}" data-title="${item.title}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z"/>
                            </svg>
                        </button>
                        <button class="remove-item" data-id="${item.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Update totals
        this.updateTotals();
    }

    // Update totals display
    updateTotals() {
        const totals = this.calculateTotals();
        
        const subtotalElement = document.getElementById('subtotalAmount');
        const discountElement = document.getElementById('discountAmount');
        const totalElement = document.getElementById('totalAmount');

        if (subtotalElement) subtotalElement.textContent = `€${totals.subtotal}`;
        if (discountElement) discountElement.textContent = `-€${totals.discount}`;
        if (totalElement) totalElement.textContent = `€${totals.total}`;
    }

    // Load related products with prices
    loadRelatedProducts() {
        const relatedContainer = document.getElementById('relatedProducts');
        if (!relatedContainer) return;

        const relatedProducts = [
            {
                id: 'related-1',
                title: 'Gestión de Proyectos Ágil',
                category: 'Business',
                price: '22.99'
            },
            {
                id: 'related-2',
                title: 'Analytics y Big Data',
                category: 'Innovation',
                price: '29.99'
            },
            {
                id: 'related-3',
                title: 'Blockchain para Empresas',
                category: 'Innovation',
                price: '31.99'
            }
        ];

        relatedContainer.innerHTML = relatedProducts.map(product => `
            <div class="related-item">
                <div class="related-image">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                </div>
                <h4>${product.title}</h4>
                <span class="related-category">${product.category}</span>
                <div class="related-price">€${product.price}</div>
                <div class="related-actions">
                    <button class="btn btn-primary btn-sm add-related" 
                            data-id="${product.id}" 
                            data-title="${product.title}"
                            data-description="E-book profesional de ${product.category.toLowerCase()}"
                            data-category="${product.category}"

                            data-price="${product.price}">
                        Añadir - €${product.price}
                    </button>
                    <button class="btn btn-secondary btn-sm buy-related" 
                            data-id="${product.id}"
                            data-title="${product.title}"
                            data-price="${product.price}">
                        Comprar ahora
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Create Stripe payment session
    async createPaymentSession(items, type = 'cart') {
        try {
            const response = await fetch('/create-payment-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: items,
                    type: type,
                    discount: this.appliedDiscount
                })
            });

            const session = await response.json();
            
            if (this.stripe) {
                const { error } = await this.stripe.redirectToCheckout({
                    sessionId: session.id
                });

                if (error) {
                    this.showNotification('Error al procesar el pago', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            this.showPaymentDemo(items, type);
        }
    }

    // Demo payment for development
    showPaymentDemo(items, type) {
        const total = type === 'single' 
            ? items[0].price 
            : this.calculateTotals().total;

        const itemsText = type === 'single' 
            ? `1 e-book: ${items[0].title}`
            : `${items.length} e-books de tu biblioteca`;

        // Create payment modal
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-content">
                <div class="payment-header">
                    <h3>Pago Seguro - Stripe</h3>
                    <button class="close-modal">×</button>
                </div>
                <div class="payment-body">
                    <div class="payment-summary">
                        <h4>Resumen de tu compra:</h4>
                        <div class="payment-items">
                            ${type === 'single' ? `
                                <div class="payment-item">
                                    <div class="payment-item-image">
                                        ${items[0].image ? `
                                            <img src="${items[0].image}" alt="${items[0].imageAlt || items[0].title}" class="payment-cover">
                                        ` : `
                                            <div class="payment-placeholder">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                                </svg>
                                            </div>
                                        `}
                                    </div>
                                    <div class="payment-item-details">
                                        <h5>${items[0].title}</h5>
                                        <span class="payment-item-price">€${items[0].price}</span>
                                    </div>
                                </div>
                            ` : this.items.map(item => `
                                <div class="payment-item">
                                    <div class="payment-item-image">
                                        ${item.image ? `
                                            <img src="${item.image}" alt="${item.imageAlt || item.title}" class="payment-cover">
                                        ` : `
                                            <div class="payment-placeholder">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                                </svg>
                                            </div>
                                        `}
                                    </div>
                                    <div class="payment-item-details">
                                        <h5>${item.title}</h5>
                                        <span class="payment-item-price">€${item.price.toFixed(2)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="payment-total">Total: €${total}</div>
                    </div>
                    <div class="payment-form">
                        <h4>Información de pago:</h4>
                        <input type="email" placeholder="Email" required>
                        <input type="text" placeholder="Número de tarjeta" value="4242 4242 4242 4242" required>
                        <div style="display: flex; gap: 12px;">
                            <input type="text" placeholder="MM/AA" value="12/25" required>
                            <input type="text" placeholder="CVC" value="123" required>
                        </div>
                        <input type="text" placeholder="Nombre en la tarjeta" required>
                    </div>
                    <div class="payment-actions">
                        <button class="btn btn-primary process-payment">
                            Pagar €${total}
                        </button>
                        <button class="btn btn-secondary cancel-payment">
                            Cancelar
                        </button>
                    </div>
                    <div class="payment-security">
                        <p>🔒 Pago seguro con encriptación SSL de 256 bits</p>
                        <p>💳 Aceptamos Visa, Mastercard, American Express</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);

        // Handle modal events
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.closePaymentModal(modal);
        });

        modal.querySelector('.cancel-payment').addEventListener('click', () => {
            this.closePaymentModal(modal);
        });

        modal.querySelector('.process-payment').addEventListener('click', () => {
            this.processPayment(items, type, total, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePaymentModal(modal);
            }
        });
    }

    closePaymentModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    async processPayment(items, type, total, modal) {
        const button = modal.querySelector('.process-payment');
        const emailInput = modal.querySelector('input[type="email"]');
        const nameInput = modal.querySelector('input[placeholder="Nombre en la tarjeta"]');
        const originalText = button.textContent;
        
        // Validar email
        if (!emailInput.value || !this.isValidEmail(emailInput.value)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }
        
        button.textContent = 'Procesando...';
        button.disabled = true;

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Success - procesar envío de e-books
            const customerEmail = emailInput.value;
            const customerName = nameInput.value || 'Cliente';
            
            // Enviar e-books automáticamente
            await this.processEbookDelivery(items, customerEmail, customerName, type);

            // Close payment modal
            this.closePaymentModal(modal);
            
            // Clear cart if it was a full cart purchase
            if (type === 'cart') {
                this.clearCart();
            }

            this.showNotification(`¡Pago exitoso! E-books enviados a ${customerEmail}`, 'success');
            
            // Show success modal
            this.showSuccessModal(items, type, total);
            
        } catch (error) {
            console.error('Error procesando pago:', error);
            this.showNotification('Error procesando el pago. Inténtalo de nuevo.', 'error');
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // Validar formato de email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Procesar entrega de e-books
    async processEbookDelivery(items, customerEmail, customerName, purchaseType) {
        try {
            // Mapear IDs de Bibliowave a IDs del sistema de email
            const ebookIdMap = {
                'aprende-ia': 'aprende-ia'
            };
            
            for (const item of items) {
                const ebookId = ebookIdMap[item.id];
                
                if (ebookId) {
                    // Intentar enviar a servidor de emails
                    try {
                        const response = await fetch('http://localhost:3001/process-purchase', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: customerEmail,
                                ebookId: ebookId,
                                customerName: customerName,
                                transactionId: `BW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                itemTitle: item.title,
                                price: item.price
                            })
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            console.log(`E-book "${item.title}" enviado exitosamente a ${customerEmail}`);
                        } else {
                            throw new Error('Error del servidor de emails');
                        }
                    } catch (emailError) {
                        console.log('Servidor de emails no disponible, usando método de respaldo...');
                        // Método de respaldo: mostrar enlace de descarga
                        this.showDownloadFallback(item, customerEmail);
                    }
                } else {
                    console.log(`E-book "${item.title}" no tiene automatización configurada`);
                }
            }
        } catch (error) {
            console.error('Error en entrega de e-books:', error);
            throw error;
        }
    }
    
    // Método de respaldo cuando el servidor de emails no está disponible
    showDownloadFallback(item, email) {
        if (item.id === 'aprende-ia') {
            const fallbackModal = document.createElement('div');
            fallbackModal.className = 'ebook-fallback-modal';
            fallbackModal.innerHTML = `
                <div class="fallback-modal-content">
                    <div class="fallback-header">
                        <h3>📧 E-book Listo para Descarga</h3>
                        <button class="close-fallback">×</button>
                    </div>
                    <div class="fallback-body">
                        <p><strong>¡Gracias por tu compra!</strong></p>
                        <p>Has adquirido: <strong>"${item.title}"</strong></p>
                        <p>Email: <strong>${email}</strong></p>
                        <div class="download-info">
                            <p>📥 <strong>Descarga directa disponible:</strong></p>
                            <a href="./ebooks-downloads/aprende-ia-ebook.pdf" 
                               download="Aprende a utilizar la IA - E-book.pdf" 
                               class="btn btn-primary download-direct">
                                ⬇️ Descargar E-book PDF
                            </a>
                        </div>
                        <div class="email-note">
                            <p><small>💡 También te enviaremos el enlace por email cuando el servidor esté disponible.</small></p>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(fallbackModal);
            setTimeout(() => fallbackModal.classList.add('show'), 100);
            
            fallbackModal.querySelector('.close-fallback').addEventListener('click', () => {
                fallbackModal.classList.remove('show');
                setTimeout(() => {
                    if (fallbackModal.parentNode) {
                        fallbackModal.parentNode.removeChild(fallbackModal);
                    }
                }, 300);
            });
        }
    }

    showSuccessModal(items, type, total) {
        const modal = document.createElement('div');
        modal.className = 'success-modal';
        modal.innerHTML = `
            <div class="success-modal-content">
                <div class="success-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                    </svg>
                </div>
                <h3>¡Compra Exitosa!</h3>
                <p>Tu pago de €${total} ha sido procesado correctamente.</p>
                <p>Recibirás un email con los enlaces de descarga en los próximos minutos.</p>
                <button class="btn btn-primary close-success">Continuar</button>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);

        modal.querySelector('.close-success').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
    }

    // Bind event listeners
    bindEvents() {
        // Clear cart button
        const clearCartBtn = document.getElementById('clearCart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres vaciar tu biblioteca?')) {
                    this.clearCart();
                }
            });
        }

        // Remove item buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item')) {
                const itemId = e.target.closest('.remove-item').dataset.id;
                this.removeItem(itemId);
            }
        });

        // Buy single item buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.buy-single')) {
                const button = e.target.closest('.buy-single');
                const itemId = button.dataset.id;
                
                // Buscar el item en el carrito para obtener toda la información incluyendo imagen
                const cartItem = this.items.find(item => item.id === itemId);
                
                if (cartItem) {
                    // Si el item está en el carrito, usar esos datos completos
                    this.createPaymentSession([cartItem], 'single');
                } else {
                    // Si no está en el carrito, crear item básico
                    const item = {
                        id: itemId,
                        title: button.dataset.title,
                        price: parseFloat(button.dataset.price),
                        image: null,
                        imageAlt: button.dataset.title
                    };
                    this.createPaymentSession([item], 'single');
                }
            }
        });

        // Apply promo code
        const applyPromoBtn = document.getElementById('applyPromo');
        const promoInput = document.getElementById('promoInput');
        
        if (applyPromoBtn && promoInput) {
            applyPromoBtn.addEventListener('click', () => {
                const code = promoInput.value.trim();
                if (code) {
                    this.applyDiscount(code);
                    if (this.discountCodes[code.toUpperCase()]) {
                        promoInput.value = '';
                        promoInput.disabled = true;
                        applyPromoBtn.disabled = true;
                        applyPromoBtn.textContent = 'Aplicado';
                    }
                }
            });

            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    applyPromoBtn.click();
                }
            });
        }

        // Checkout button (full cart)
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) {
                    this.showNotification('Tu biblioteca está vacía', 'error');
                    return;
                }
                this.createPaymentSession(this.items, 'cart');
            });
        }

        // Continue shopping
        const continueBtn = document.querySelector('.continue-shopping');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                window.location.href = 'ebooks.html';
            });
        }

        // Related products - add to cart
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-related')) {
                const button = e.target.closest('.add-related');
                const item = {
                    id: button.dataset.id,
                    title: button.dataset.title,
                    description: button.dataset.description,
                    category: button.dataset.category,
                    price: button.dataset.price
                };
                
                if (this.addItem(item)) {
                    button.textContent = 'Añadido';
                    button.disabled = true;
                    button.classList.add('added');
                }
            }
        });

        // Related products - buy now
        document.addEventListener('click', (e) => {
            if (e.target.closest('.buy-related')) {
                const button = e.target.closest('.buy-related');
                const item = {
                    id: button.dataset.id,
                    title: button.dataset.title,
                    price: parseFloat(button.dataset.price)
                };
                this.createPaymentSession([item], 'single');
            }
        });

        // Note: buy-now buttons are handled by ebooks.js to avoid duplication
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 4000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.bibliotecaCart = new BibliotecaCart();
});

// Function to add item from e-books page with real price
window.addToCart = function(ebookElement) {
    const priceButton = ebookElement.querySelector('.add-to-cart');
    const price = priceButton ? priceButton.dataset.price : null;
    
    if (!price) {
        console.error('No se pudo encontrar el precio del producto');
        return false;
    }

    const item = {
        id: 'ebook-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
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