/**
 * Store Page - Branded merchandise and services
 * Uses Stripe for payments
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import * as Haptics from '../lib/haptics';

interface ProductVariant {
  id: string;
  name: string;
  priceModifier?: number; // additional cost in cents
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  imageUrl: string;
  category: 'apparel' | 'gear' | 'service';
  variants?: ProductVariant[];
  inStock: boolean;
  featured?: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  imageUrl: string;
}

export default function StorePage() {
  const { user, registration } = useAuth();
  const { theme } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('category'), orderBy('name'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Use placeholder products if none in Firestore
        setProducts(PLACEHOLDER_PRODUCTS);
      } else {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(items);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(PLACEHOLDER_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  const addToCart = (product: Product, variant?: string) => {
    Haptics.lightTap();

    const variantData = variant && product.variants
      ? product.variants.find(v => v.id === variant)
      : null;

    const itemPrice = product.price + (variantData?.priceModifier || 0);

    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && item.variant === variant
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...prev, {
        productId: product.id,
        name: product.name + (variantData ? ` (${variantData.name})` : ''),
        price: itemPrice,
        quantity: 1,
        variant,
        imageUrl: product.imageUrl,
      }];
    });

    setSelectedProduct(null);
    setSelectedVariant('');
  };

  const removeFromCart = (index: number) => {
    Haptics.lightTap();
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    Haptics.selectionChanged();
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to complete your purchase.');
      return;
    }

    if (cart.length === 0) return;

    setProcessing(true);

    try {
      const functions = getFunctions();
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');

      // Determine if shipping is required (any physical items)
      const hasPhysicalItems = cart.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.category === 'apparel' || product?.category === 'gear';
      });

      // Get email - prefer user.email, fallback to registration email
      const customerEmail = user.email || registration?.email || '';

      const result = await createPaymentIntent({
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
        })),
        customerEmail,
        shippingRequired: hasPhysicalItems,
      });

      const { clientSecret, paymentIntentId } = result.data as {
        clientSecret: string;
        paymentIntentId: string;
      };

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'NorCal Moto Adventure',
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          email: customerEmail || undefined,
        },
      });

      if (initError) {
        console.error('Payment sheet init error:', initError);
        Alert.alert('Error', 'Unable to initialize payment. Please try again.');
        return;
      }

      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          // User cancelled - no need to show error
          return;
        }
        console.error('Payment error:', paymentError);
        Alert.alert('Payment Failed', paymentError.message);
        return;
      }

      // Payment successful - confirm order
      const confirmOrder = httpsCallable(functions, 'confirmOrder');
      await confirmOrder({ paymentIntentId });

      Haptics.success();
      setCart([]);
      setCartVisible(false);
      Alert.alert(
        'Order Confirmed!',
        'Thank you for your purchase. You will receive a confirmation email shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Checkout error:', error);
      Haptics.error();
      Alert.alert('Error', error.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const renderProductCard = (product: Product) => (
    <TouchableOpacity
      key={product.id}
      style={[styles.productCard, { backgroundColor: theme.card }]}
      onPress={() => {
        if (product.variants && product.variants.length > 0) {
          setSelectedProduct(product);
        } else {
          addToCart(product);
        }
      }}
      disabled={!product.inStock}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
      {!product.inStock && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}
      {product.featured && product.inStock && (
        <View style={[styles.featuredBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={[styles.productDescription, { color: theme.textMuted }]} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: theme.accent }]}>
            {formatPrice(product.price)}
          </Text>
          {product.inStock && (
            <View style={[styles.addButton, { backgroundColor: theme.accent }]}>
              <FontAwesome name="plus" size={12} color="#ffffff" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (category: string, title: string) => {
    const categoryProducts = products.filter(p => p.category === category);
    if (categoryProducts.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>{title}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productRow}
        >
          {categoryProducts.map(renderProductCard)}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Store</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setCartVisible(true)}>
          <FontAwesome name="shopping-cart" size={20} color={theme.textPrimary} />
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.danger }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: theme.card }]}>
            <FontAwesome name="motorcycle" size={32} color={theme.accent} />
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              NorCal Moto Adventure
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
              Official Gear & Services
            </Text>
          </View>

          {renderCategory('apparel', 'Apparel')}
          {renderCategory('gear', 'Gear & Rentals')}
          {renderCategory('service', 'Services')}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Variant Selection Modal */}
      <Modal
        visible={selectedProduct !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.variantModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.variantTitle, { color: theme.textPrimary }]}>
              Select Option
            </Text>
            <Text style={[styles.variantProductName, { color: theme.textMuted }]}>
              {selectedProduct?.name}
            </Text>

            <View style={styles.variantOptions}>
              {selectedProduct?.variants?.map(variant => (
                <TouchableOpacity
                  key={variant.id}
                  style={[
                    styles.variantOption,
                    {
                      backgroundColor: selectedVariant === variant.id ? theme.accent : theme.background,
                      borderColor: selectedVariant === variant.id ? theme.accent : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedVariant(variant.id)}
                >
                  <Text
                    style={[
                      styles.variantOptionText,
                      { color: selectedVariant === variant.id ? '#ffffff' : theme.textPrimary },
                    ]}
                  >
                    {variant.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.variantActions}>
              <TouchableOpacity
                style={[styles.variantCancelButton, { borderColor: theme.cardBorder }]}
                onPress={() => {
                  setSelectedProduct(null);
                  setSelectedVariant('');
                }}
              >
                <Text style={[styles.variantCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.variantAddButton,
                  { backgroundColor: selectedVariant ? theme.accent : theme.cardBorder },
                ]}
                onPress={() => selectedVariant && selectedProduct && addToCart(selectedProduct, selectedVariant)}
                disabled={!selectedVariant}
              >
                <Text style={styles.variantAddText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal
        visible={cartVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCartVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { backgroundColor: theme.card }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.textPrimary }]}>Your Cart</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <FontAwesome name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <FontAwesome name="shopping-cart" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyCartText, { color: theme.textMuted }]}>
                  Your cart is empty
                </Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartItems}>
                  {cart.map((item, index) => (
                    <View key={`${item.productId}-${item.variant}-${index}`} style={[styles.cartItem, { borderBottomColor: theme.cardBorder }]}>
                      <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
                      <View style={styles.cartItemInfo}>
                        <Text style={[styles.cartItemName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.cartItemPrice, { color: theme.accent }]}>
                          {formatPrice(item.price)}
                        </Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[styles.quantityButton, { backgroundColor: theme.background }]}
                          onPress={() => updateQuantity(index, -1)}
                        >
                          <FontAwesome name="minus" size={12} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.quantityText, { color: theme.textPrimary }]}>
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          style={[styles.quantityButton, { backgroundColor: theme.background }]}
                          onPress={() => updateQuantity(index, 1)}
                        >
                          <FontAwesome name="plus" size={12} color={theme.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => removeFromCart(index)}>
                        <FontAwesome name="trash" size={16} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={[styles.cartFooter, { borderTopColor: theme.cardBorder }]}>
                  <View style={styles.cartTotal}>
                    <Text style={[styles.cartTotalLabel, { color: theme.textSecondary }]}>Total</Text>
                    <Text style={[styles.cartTotalAmount, { color: theme.textPrimary }]}>
                      {formatPrice(cartTotal)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkoutButton, { backgroundColor: theme.accent }]}
                    onPress={handleCheckout}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <FontAwesome name="lock" size={16} color="#ffffff" />
                        <Text style={styles.checkoutButtonText}>Checkout</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Placeholder products until Firestore is populated
const PLACEHOLDER_PRODUCTS: Product[] = [
  {
    id: 'hat-1',
    name: 'Baseball Hat',
    description: 'Classic NorCal Moto Adventure cap with embroidered logo',
    price: 2000, // $20.00
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
    category: 'apparel',
    inStock: true,
    featured: true,
  },
  {
    id: 'tshirt-1',
    name: 'T-Shirt',
    description: 'Comfortable cotton tee with tour graphic',
    price: 2000, // $20.00
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'apparel',
    variants: [
      { id: 'S', name: 'Small' },
      { id: 'M', name: 'Medium' },
      { id: 'L', name: 'Large' },
      { id: 'XL', name: 'X-Large' },
    ],
    inStock: true,
  },
  {
    id: 'jersey-1',
    name: 'Riding Jersey',
    description: 'Moisture-wicking adventure jersey with tour branding',
    price: 4000, // $40.00
    imageUrl: 'https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400',
    category: 'apparel',
    variants: [
      { id: 'S', name: 'Small' },
      { id: 'M', name: 'Medium' },
      { id: 'L', name: 'Large' },
      { id: 'XL', name: 'X-Large' },
    ],
    inStock: true,
  },
  {
    id: 'camping-weekend',
    name: 'Camping Gear Rental - Weekend',
    description: 'Tent, sleeping bag, and pad for a weekend adventure',
    price: 2500, // $25.00
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
    category: 'gear',
    inStock: true,
  },
  {
    id: 'camping-week',
    name: 'Camping Gear Rental - Week',
    description: 'Tent, sleeping bag, and pad for a full week',
    price: 5000, // $50.00
    imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400',
    category: 'gear',
    inStock: true,
  },
  {
    id: 'trip-planning',
    name: 'Custom Trip Planning',
    description: 'Routes, campgrounds, hotels, GPX files + two 30-min consultations',
    price: 10000, // $100.00
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400',
    category: 'service',
    inStock: true,
    featured: true,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cartButton: {
    padding: spacing.sm,
    width: 44,
    alignItems: 'flex-end',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 14,
  },
  categorySection: {
    marginTop: spacing.xl,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  productRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  productCard: {
    width: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
  },
  productDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  variantModal: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  variantTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  variantProductName: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  variantOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  variantOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  variantActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  variantCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  variantCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  variantAddButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  variantAddText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartModal: {
    maxHeight: '80%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyCart: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyCartText: {
    fontSize: 16,
  },
  cartItems: {
    maxHeight: 300,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cartItemPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  cartFooter: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTotalLabel: {
    fontSize: 16,
  },
  cartTotalAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
