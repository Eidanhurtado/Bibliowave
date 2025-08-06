// Blog functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.article-filters .filter-btn');
    const articleCards = document.querySelectorAll('.article-card');
    const loadMoreBtn = document.getElementById('loadMoreArticles');
    
    let visibleArticles = 6;

    // Initialize
    updateVisibleArticles();

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            filterArticles(filterValue);
        });
    });

    // Filter articles function
    function filterArticles(category) {
        articleCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
                card.classList.remove('fade-in');
            }
        });

        // Reset visible articles counter
        visibleArticles = 6;
        updateVisibleArticles();
    }

    // Update visible articles
    function updateVisibleArticles() {
        const visibleCards = Array.from(articleCards).filter(card => 
            card.style.display !== 'none'
        );
        
        // Show articles up to visibleArticles limit
        visibleCards.forEach((card, index) => {
            if (index < visibleArticles) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
            }
        });

        // Update load more button
        if (visibleArticles >= visibleCards.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    // Load more functionality
    loadMoreBtn.addEventListener('click', function() {
        visibleArticles += 3;
        updateVisibleArticles();
        
        // Add loading animation
        this.textContent = 'Cargando...';
        this.disabled = true;
        
        setTimeout(() => {
            this.textContent = 'Cargar más artículos';
            this.disabled = false;
        }, 1000);
    });

    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            showFeedback('¡Gracias por suscribirte a nuestras alertas de seguridad!');
            this.reset();
        });
    }

    // Contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            showFeedback('¡Mensaje enviado! Te responderemos pronto.');
            this.reset();
        });
    }

    // Show feedback function
    function showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--primary-color);
            color: var(--secondary-color);
            padding: 12px 20px;
            border-radius: var(--border-radius);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 3000);
    }

    // Category cards click
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('h3').textContent.toLowerCase();
            let filterValue = 'all';
            
            if (categoryName.includes('amenaza')) filterValue = 'amenazas';
            else if (categoryName.includes('protección')) filterValue = 'proteccion';
            else if (categoryName.includes('empresa')) filterValue = 'empresas';
            
            // Update filter
            filterButtons.forEach(btn => btn.classList.remove('active'));
            const targetBtn = document.querySelector(`[data-filter="${filterValue}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');
                filterArticles(filterValue);
            }
            
            // Scroll to articles
            document.querySelector('.recent-articles').scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add hover effects to articles
    articleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Reading progress indicator
    function updateReadingProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        let progressBar = document.querySelector('.reading-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'reading-progress';
            progressBar.style.cssText = `
                position: fixed;
                top: 70px;
                left: 0;
                width: ${scrolled}%;
                height: 3px;
                background: var(--primary-color);
                z-index: 999;
                transition: width 0.1s ease;
            `;
            document.body.appendChild(progressBar);
        } else {
            progressBar.style.width = scrolled + '%';
        }
    }

    window.addEventListener('scroll', updateReadingProgress);

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.category-card, .tip-card, .article-card').forEach(element => {
        observer.observe(element);
    });
});

// Add custom styles for blog-specific animations
const blogStyles = document.createElement('style');
blogStyles.textContent = `
    .article-card {
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(30px);
    }
    
    .article-card.fade-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .category-card {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .category-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-medium);
    }
    
    .tip-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
    
    .tip-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(blogStyles); 