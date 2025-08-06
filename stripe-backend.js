// Bibliowave Stripe Backend - stripe-backend.js
const express = require('express');
const stripe = require('stripe')('sk_test_...'); // Reemplazar con tu clave secreta de Stripe
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos

// Configuración de productos
const PRODUCTS = {
    'estrategias-marketing': {
        name: 'Estrategias de Marketing Digital',
        price: 2499, // En centavos (€24.99)
        description: 'E-book profesional sobre marketing digital moderno'
    },
    'ciberseguridad-empresarial': {
        name: 'Ciberseguridad Empresarial Avanzada',
        price: 3499, // €34.99
        description: 'Guía completa de ciberseguridad para empresas'
    },
    'innovacion-digital': {
        name: 'Innovación y Transformación Digital',
        price: 1999, // €19.99
        description: 'Metodologías de innovación disruptiva'
    },
    'liderazgo-ejecutivo': {
        name: 'Liderazgo Ejecutivo Moderno',
        price: 2799, // €27.99
        description: 'Habilidades de liderazgo para la era digital'
    },
    'hacking-etico': {
        name: 'Hacking Ético y Pentesting',
        price: 3999, // €39.99
        description: 'Técnicas profesionales de ciberseguridad ofensiva'
    },
    'inteligencia-artificial': {
        name: 'Inteligencia Artificial para Empresas',
        price: 3299, // €32.99
        description: 'Implementación de IA en modelos de negocio'
    }
};

// Endpoint para crear sesión de pago
app.post('/create-payment-session', async (req, res) => {
    try {
        const { items, type, discount = 0 } = req.body;
        
        let lineItems = [];
        
        if (type === 'single') {
            // Compra individual
            const item = items[0];
            const productKey = slugify(item.title);
            const product = PRODUCTS[productKey] || {
                name: item.title,
                price: Math.round(item.price * 100),
                description: `E-book: ${item.title}`
            };
            
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product.name,
                        description: product.description,
                        images: ['https://bibliowave.com/assets/ebook-icon.png'], // Opcional
                    },
                    unit_amount: product.price,
                },
                quantity: 1,
            });
        } else {
            // Carrito completo
            items.forEach(item => {
                const productKey = slugify(item.title);
                const product = PRODUCTS[productKey] || {
                    name: item.title,
                    price: Math.round(item.price * 100),
                    description: `E-book: ${item.title}`
                };
                
                lineItems.push({
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: product.name,
                            description: product.description,
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                });
            });
        }

        // Aplicar descuento si existe
        let discounts = [];
        if (discount > 0) {
            // Crear cupón de descuento dinámico
            const coupon = await stripe.coupons.create({
                percent_off: discount * 100,
                duration: 'once',
            });
            
            discounts.push({
                coupon: coupon.id,
            });
        }

        // Crear sesión de Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            discounts: discounts,
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/biblioteca.html`,
            metadata: {
                type: type,
                customer_email: req.body.email || 'cliente@bibliowave.com'
            },
            // Configurar para recibir pagos en tu cuenta
            payment_intent_data: {
                metadata: {
                    source: 'bibliowave',
                    type: type
                }
            }
        });

        res.json({ id: session.id });
        
    } catch (error) {
        console.error('Error creando sesión de pago:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook para manejar eventos de Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_...'; // Tu webhook secret de Stripe
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Manejar el evento
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Pago completado:', session);
            
            // Aquí puedes:
            // 1. Enviar email con los e-books
            // 2. Registrar la venta en tu base de datos
            // 3. Generar enlaces de descarga
            handleSuccessfulPayment(session);
            break;
            
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment Intent exitoso:', paymentIntent);
            break;
            
        default:
            console.log(`Evento no manejado: ${event.type}`);
    }
    
    res.json({ received: true });
});

// Función para manejar pagos exitosos
async function handleSuccessfulPayment(session) {
    try {
        // Obtener detalles del cliente
        const customer = await stripe.customers.retrieve(session.customer);
        
        // Aquí implementarías:
        // 1. Envío de email con los e-books
        // 2. Registro en base de datos
        // 3. Generación de enlaces de descarga
        
        console.log('Procesando pago exitoso para:', customer.email);
        
        // Ejemplo de email (implementar con tu servicio de email preferido)
        await sendEbookEmail(customer.email, session);
        
    } catch (error) {
        console.error('Error procesando pago exitoso:', error);
    }
}

// Función para enviar email con e-books
async function sendEbookEmail(email, session) {
    // Implementar con tu servicio de email (SendGrid, Mailgun, etc.)
    console.log(`Enviando e-books a: ${email}`);
    
    // Aquí generarías enlaces de descarga únicos y temporales
    // para cada e-book comprado
}

// Página de éxito
app.get('/success', async (req, res) => {
    const { session_id } = req.query;
    
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Compra Exitosa - Bibliowave</title>
                <meta charset="utf-8">
                <link rel="stylesheet" href="styles.css">
            </head>
            <body>
                <div style="text-align: center; padding: 60px 20px;">
                    <h1>¡Compra Exitosa! ✅</h1>
                    <p>Tu pago de €${(session.amount_total / 100).toFixed(2)} ha sido procesado correctamente.</p>
                    <p>Recibirás un email con tus e-books en los próximos minutos.</p>
                    <a href="/" class="btn btn-primary">Volver a Bibliowave</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error verificando pago');
    }
});

// Función helper para crear slugs
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Servir archivos estáticos (tu sitio web)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Bibliowave server corriendo en puerto ${port}`);
    console.log(`💳 Stripe configurado para pagos reales`);
    console.log(`🔗 Webhook endpoint: /webhook`);
});

module.exports = app; 