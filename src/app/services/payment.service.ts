import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE, PurchasesStoreProduct } from '@revenuecat/purchases-capacitor';

export interface PaymentProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  productId?: string;
  error?: string;
  isInTrial?: boolean; // 🆕 Indica si la compra es un trial period
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  
  private isNativePlatform: boolean = false;
  private isInitialized: boolean = false;

  constructor(private platform: Platform) {
    this.isNativePlatform = this.platform.is('ios') || this.platform.is('android');
    console.log('💳 PaymentService: Plataforma nativa detectada:', this.isNativePlatform);
  }

  /**
   * Inicializa RevenueCat SDK para In-App Purchases
   * Solo se ejecuta en iOS/Android
   */
  async initialize(apiKey: string): Promise<void> {
    if (!this.isNativePlatform) {
      console.log('💳 PaymentService: Plataforma web, no se inicializa RevenueCat');
      return;
    }

    if (this.isInitialized) {
      console.log('💳 PaymentService: Ya inicializado');
      return;
    }

    try {
      console.log('💳 PaymentService: Inicializando RevenueCat...');
      
      await Purchases.configure({
        apiKey: apiKey,
        appUserID: undefined, // Se puede agregar el user ID después del login
      });

      // Configurar nivel de logs (solo en desarrollo)
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      this.isInitialized = true;
      console.log('✅ PaymentService: RevenueCat inicializado correctamente');
    } catch (error) {
      console.error('❌ PaymentService: Error inicializando RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Identifica al usuario en RevenueCat
   * @param userId ID del usuario autenticado
   */
  async identifyUser(userId: string): Promise<void> {
    if (!this.isNativePlatform || !this.isInitialized) {
      return;
    }

    try {
      console.log('👤 PaymentService: Identificando usuario:', userId);
      await Purchases.logIn({ appUserID: userId });
      console.log('✅ PaymentService: Usuario identificado');
    } catch (error) {
      console.error('❌ PaymentService: Error identificando usuario:', error);
    }
  }

  /**
   * Cierra sesión del usuario en RevenueCat
   */
  async logoutUser(): Promise<void> {
    if (!this.isNativePlatform || !this.isInitialized) {
      return;
    }

    try {
      console.log('👋 PaymentService: Cerrando sesión de usuario en RevenueCat');
      await Purchases.logOut();
      console.log('✅ PaymentService: Sesión cerrada');
    } catch (error) {
      console.error('❌ PaymentService: Error cerrando sesión:', error);
    }
  }

  /**
   * Obtiene los productos disponibles desde la tienda
   * @param productIds Array de IDs de productos configurados en App Store/Play Store
   */
  async getProducts(productIds: string[]): Promise<PaymentProduct[]> {
    if (!this.isNativePlatform || !this.isInitialized) {
      console.warn('⚠️ PaymentService: No se pueden obtener productos en plataforma web');
      return [];
    }

    try {
      console.log('🛒 PaymentService: Obteniendo productos:', productIds);
      
      const { products } = await Purchases.getProducts({
        productIdentifiers: productIds,
      });

      console.log('📦 PaymentService: Productos obtenidos:', products);

      const paymentProducts: PaymentProduct[] = products.map((product: PurchasesStoreProduct) => ({
        id: product.identifier,
        title: product.title,
        description: product.description,
        price: product.priceString,
        priceAmount: product.price,
        currency: product.currencyCode,
      }));

      return paymentProducts;
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo productos:', error);
      throw error;
    }
  }

  /**
   * Inicia el proceso de compra de un producto
   * @param productId ID del producto a comprar
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isNativePlatform || !this.isInitialized) {
      return {
        success: false,
        error: 'In-App Purchases no disponible en plataforma web'
      };
    }

    try {
      console.log('💰 PaymentService: Iniciando compra de producto:', productId);
      console.log('📱 PaymentService: Plataforma detectada:', this.platform.platforms());
      console.log('🔑 PaymentService: SDK inicializado:', this.isInitialized);
      
      // Primero obtener el producto completo
      const { products } = await Purchases.getProducts({
        productIdentifiers: [productId],
      });

      console.log('📦 PaymentService: Respuesta de getProducts:', { 
        count: products?.length || 0, 
        products: products 
      });

      if (!products || products.length === 0) {
        console.error('❌ PaymentService: No se encontró el producto:', productId);
        console.error('❌ Posibles causas:');
        console.error('   1. Producto no configurado en App Store Connect');
        console.error('   2. Product ID incorrecto en la base de datos');
        console.error('   3. Producto no importado en RevenueCat');
        console.error('   4. Bundle ID no coincide entre Xcode y App Store Connect');
        console.error('   5. API Key de iOS incorrecta');
        console.error('   6. Necesitas configurar StoreKit Testing en simulador');
        console.error('💡 Solución: Ver FIX_PRODUCT_NOT_FOUND_IOS.md');
        throw new Error('Producto no encontrado en la tienda');
      }

      const product = products[0];
      console.log('✅ PaymentService: Producto encontrado:', {
        identifier: product.identifier,
        title: product.title,
        price: product.priceString,
        description: product.description
      });
      
      const { customerInfo } = await Purchases.purchaseStoreProduct({
        product: product
      });

      console.log('✅ PaymentService: Compra exitosa:', customerInfo);

      // Verificar si el producto está activo en el customerInfo
      const activeEntitlements = customerInfo.entitlements.active;
      const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;

      // 🔍 Obtener información de la transacción más reciente
      // Si hay entitlements activos, buscar el más reciente
      let latestTransactionId = `${customerInfo.originalAppUserId}_${Date.now()}`;
      let isInTrial = false;
      
      if (hasActiveSubscription) {
        // Obtener el primer entitlement activo (debería ser el que acabamos de comprar)
        const entitlementKeys = Object.keys(activeEntitlements);
        if (entitlementKeys.length > 0) {
          const firstEntitlement = activeEntitlements[entitlementKeys[0]];
          
          // Usar el originalPurchaseDate como parte del ID único
          const purchaseDate = firstEntitlement.originalPurchaseDate;
          if (purchaseDate) {
            latestTransactionId = `${customerInfo.originalAppUserId}_${new Date(purchaseDate).getTime()}`;
          }
          
          // Detectar si está en trial
          // periodType puede ser: "normal", "trial", "intro", "promotional"
          isInTrial = firstEntitlement.periodType === 'trial' || 
                     firstEntitlement.willRenew === false ||
                     (firstEntitlement.unsubscribeDetectedAt !== null && firstEntitlement.billingIssueDetectedAt === null);
          
          console.log('📊 Entitlement info:', {
            periodType: firstEntitlement.periodType,
            willRenew: firstEntitlement.willRenew,
            isInTrial: isInTrial
          });
        }
      }

      return {
        success: true,
        productId: productId,
        transactionId: latestTransactionId,
        isInTrial: isInTrial // 🆕 Indicar si es trial
      };
    } catch (error: any) {
      console.error('❌ PaymentService: Error en compra:', error);
      
      // Manejar errores específicos de RevenueCat
      let errorMessage = 'Error procesando el pago';
      
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        errorMessage = 'Compra cancelada por el usuario';
      } else if (error.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
        errorMessage = 'Problema con la tienda. Intenta más tarde';
      } else if (error.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
        errorMessage = 'Las compras no están permitidas en este dispositivo';
      } else if (error.code === PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR) {
        errorMessage = 'El producto no es válido o no está disponible';
      } else if (error.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
        errorMessage = 'Producto no disponible para compra';
      } else if (error.code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Restaura las compras anteriores del usuario
   * Útil cuando el usuario reinstala la app o cambia de dispositivo
   */
  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.isNativePlatform || !this.isInitialized) {
      return {
        success: false,
        error: 'Restauración no disponible en plataforma web'
      };
    }

    try {
      console.log('🔄 PaymentService: Restaurando compras...');
      
      const { customerInfo } = await Purchases.restorePurchases();
      
      console.log('✅ PaymentService: Compras restauradas:', customerInfo);

      const activeEntitlements = customerInfo.entitlements.active;
      const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;

      return {
        success: hasActiveSubscription,
        error: hasActiveSubscription ? undefined : 'No se encontraron compras anteriores'
      };
    } catch (error: any) {
      console.error('❌ PaymentService: Error restaurando compras:', error);
      return {
        success: false,
        error: 'Error al restaurar las compras'
      };
    }
  }

  /**
   * Verifica si el usuario tiene una suscripción activa
   */
  async hasActiveSubscription(): Promise<boolean> {
    if (!this.isNativePlatform || !this.isInitialized) {
      return false;
    }

    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const activeEntitlements = customerInfo.entitlements.active;
      return Object.keys(activeEntitlements).length > 0;
    } catch (error) {
      console.error('❌ PaymentService: Error verificando suscripción:', error);
      return false;
    }
  }

  /**
   * Indica si la plataforma actual soporta In-App Purchases nativos
   */
  isNativePlatformAvailable(): boolean {
    return this.isNativePlatform;
  }

  /**
   * Indica si se debe usar PayPal (plataforma web)
   */
  shouldUsePayPal(): boolean {
    return !this.isNativePlatform;
  }
}
