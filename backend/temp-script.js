const { AIService } = require('./dist/services/aiService');

(async () => {
  try {
    console.log('>>> Starting test');
    const result = await AIService.generateQuoteEnterprise(
      'Proyecto de tienda online encargada por Cliente para una marca de ropa urbana. Se requiere diseño personalizado, catálogo con al menos 50 productos, integración con pasarelas de pago (Stripe y PayPal), sistema de gestión de inventario, notificaciones por correo, SEO básico y conexión con redes sociales.\n\nEl cliente solicita un proyecto de una pagina web que incluya un panel de administración para gestionar pedidos, clientes y productos, con posibilidad de subir imágenes, editar descripciones y aplicar descuentos.\n\nLa tienda debe ser responsive, con diseño atractivo y rendimiento optimizado para móviles. Se desea que el sistema esté listo en 3 semanas, incluyendo pruebas funcionales y soporte post-lanzamiento.',
      'Cliente Demo',
      'medio',
      'ecommerce',
      [],
      'estandar',
      'Murcia, España',
      'tester'
    );
    console.log('>>> RESULT:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('>>> Script error:', err);
  }
})();
