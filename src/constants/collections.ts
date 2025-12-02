// Comprehensive fragrance industry collections
export const AVAILABLE_COLLECTIONS = [
  // 🎯 Popular & Trending Collections
  { id: 'new-arrivals', name: 'New Arrivals', description: 'Latest products added to our store', category: 'popular' },
  { id: 'best-sellers', name: 'Best Sellers', description: 'Our most popular products', category: 'popular' },
  { id: 'staff-picks', name: 'Staff Picks', description: 'Curated by our scent experts', category: 'popular' },
  { id: 'trending-now', name: 'Trending Now', description: 'Current viral and popular fragrances', category: 'popular' },
  { id: 'customer-favorites', name: 'Customer Favorites', description: 'Top-rated by our customers', category: 'popular' },
  
  // 💰 Price Range Collections
  { id: 'luxury-collection', name: 'Luxury Collection', description: 'Premium high-end designer fragrances', category: 'price' },
  { id: 'budget-friendly', name: 'Budget Friendly', description: 'Great scents at affordable prices', category: 'price' },
  { id: 'mid-range-gems', name: 'Mid-Range Gems', description: 'Quality fragrances at moderate prices', category: 'price' },
  { id: 'designer-dupes', name: 'Designer Dupes', description: 'Affordable alternatives to designer fragrances', category: 'price' },
  
  // 👥 Gender Collections
  { id: 'mens-collection', name: "Men's Collection", description: 'Masculine fragrances and colognes', category: 'gender' },
  { id: 'womens-collection', name: "Women's Collection", description: 'Feminine perfumes and scents', category: 'gender' },
  { id: 'unisex-collection', name: 'Unisex Collection', description: 'Gender-neutral fragrances for everyone', category: 'gender' },
  
  // 🌟 Seasonal Collections
  { id: 'seasonal-spring', name: 'Spring Awakening', description: 'Fresh, floral scents for spring', category: 'seasonal' },
  { id: 'seasonal-summer', name: 'Summer Breeze', description: 'Light, aquatic, and citrus summer scents', category: 'seasonal' },
  { id: 'seasonal-fall', name: 'Autumn Spice', description: 'Warm, spicy, and woody autumn fragrances', category: 'seasonal' },
  { id: 'seasonal-winter', name: 'Winter Warmth', description: 'Rich, cozy, and warming winter scents', category: 'seasonal' },
  
  // 🎉 Holiday & Special Occasion Collections
  { id: 'holiday-2025', name: 'Holiday 2025', description: 'Festive scents for the holiday season', category: 'seasonal' },
  { id: 'valentine-romance', name: 'Valentine Romance', description: 'Romantic and sensual scents for love', category: 'seasonal' },
  { id: 'mothers-day', name: "Mother's Day", description: 'Perfect gifts for mothers', category: 'seasonal' },
  { id: 'graduation-gifts', name: 'Graduation Gifts', description: 'Milestone celebration scents', category: 'seasonal' },
  { id: 'wedding-collection', name: 'Wedding Collection', description: 'Bridal and wedding party fragrances', category: 'seasonal' },
  
  // 🎭 Occasion-Based Collections
  { id: 'office-appropriate', name: 'Office Appropriate', description: 'Professional, subtle scents for work', category: 'occasion' },
  { id: 'date-night', name: 'Date Night', description: 'Seductive and alluring evening fragrances', category: 'occasion' },
  { id: 'everyday-wear', name: 'Everyday Wear', description: 'Versatile scents for daily use', category: 'occasion' },
  { id: 'special-occasions', name: 'Special Occasions', description: 'Statement fragrances for events', category: 'occasion' },
  { id: 'gym-fresh', name: 'Gym & Active', description: 'Fresh, energizing scents for active lifestyle', category: 'occasion' },
  
  // 🌺 Fragrance Family Collections
  { id: 'floral-bouquet', name: 'Floral Bouquet', description: 'Rose, jasmine, and floral compositions', category: 'fragrance-family' },
  { id: 'citrus-fresh', name: 'Citrus Fresh', description: 'Lemon, orange, and zesty fragrances', category: 'fragrance-family' },
  { id: 'woody-warm', name: 'Woody & Warm', description: 'Sandalwood, cedar, and woody notes', category: 'fragrance-family' },
  { id: 'oriental-spicy', name: 'Oriental & Spicy', description: 'Exotic spices and oriental blends', category: 'fragrance-family' },
  { id: 'gourmand-sweet', name: 'Gourmand & Sweet', description: 'Vanilla, chocolate, and edible scents', category: 'fragrance-family' },
  { id: 'aquatic-marine', name: 'Aquatic & Marine', description: 'Ocean-inspired and fresh water scents', category: 'fragrance-family' },
  { id: 'green-herbal', name: 'Green & Herbal', description: 'Grass, herbs, and nature-inspired scents', category: 'fragrance-family' },
  
  // ⏰ Longevity & Performance Collections
  { id: 'long-lasting', name: 'Long Lasting', description: 'Fragrances with exceptional longevity (8+ hours)', category: 'performance' },
  { id: 'beast-mode', name: 'Beast Mode', description: 'Maximum projection and performance', category: 'performance' },
  { id: 'skin-scents', name: 'Skin Scents', description: 'Intimate, close-to-skin fragrances', category: 'performance' },
  { id: 'office-safe', name: 'Office Safe', description: 'Subtle projection for professional settings', category: 'performance' },
  
  // 🌿 Ingredient & Style Collections
  { id: 'natural-organic', name: 'Natural & Organic', description: 'Made with natural and organic ingredients', category: 'ingredient' },
  { id: 'vegan-friendly', name: 'Vegan Friendly', description: 'Cruelty-free and vegan formulations', category: 'ingredient' },
  { id: 'oil-based', name: 'Oil Based', description: 'Pure fragrance oils and attar', category: 'ingredient' },
  { id: 'alcohol-free', name: 'Alcohol Free', description: 'Gentle formulations without alcohol', category: 'ingredient' },
  { id: 'niche-artisan', name: 'Niche & Artisan', description: 'Independent and artisanal perfume houses', category: 'ingredient' },
  
  // 🎯 Age & Demographic Collections
  { id: 'teen-young', name: 'Teen & Young', description: 'Fresh, playful scents for younger users', category: 'demographic' },
  { id: 'mature-sophisticated', name: 'Mature & Sophisticated', description: 'Refined scents for experienced users', category: 'demographic' },
  { id: 'celebrity-inspired', name: 'Celebrity Inspired', description: 'Fragrances from celebrity lines', category: 'demographic' },
  
  // 🏠 Home & Lifestyle Collections
  { id: 'home-scents', name: 'Home Scents', description: 'Candles, diffusers, and home fragrances', category: 'lifestyle' },
  { id: 'car-fresheners', name: 'Car Fresheners', description: 'Automotive and travel scents', category: 'lifestyle' },
  { id: 'body-care', name: 'Body Care', description: 'Lotions, mists, and body products', category: 'lifestyle' },
  
  // 🎁 Gift Collections
  { id: 'gift-sets', name: 'Gift Sets', description: 'Curated gift packages and bundles', category: 'gift' },
  { id: 'travel-size', name: 'Travel Size', description: 'Portable and travel-friendly sizes', category: 'gift' },
  { id: 'discovery-sets', name: 'Discovery Sets', description: 'Sample sets to explore new scents', category: 'gift' },
  
  // 🌍 Regional & Cultural Collections
  { id: 'middle-eastern', name: 'Middle Eastern', description: 'Oud, amber, and Middle Eastern influences', category: 'regional' },
  { id: 'french-elegance', name: 'French Elegance', description: 'Classic French perfumery tradition', category: 'regional' },
  { id: 'american-fresh', name: 'American Fresh', description: 'Modern American fragrance style', category: 'regional' },
  { id: 'asian-inspired', name: 'Asian Inspired', description: 'Tea, incense, and Asian fragrance notes', category: 'regional' },
];

// Collection categories for organizing the UI
export const COLLECTION_CATEGORIES = {
  popular: { label: '🎯 Popular & Trending', color: 'orange' },
  price: { label: '💰 Price Range', color: 'green' },
  gender: { label: '👥 Gender', color: 'purple' },
  seasonal: { label: '🌟 Seasonal & Occasions', color: 'blue' },
  occasion: { label: '🎭 Occasion-Based', color: 'pink' },
  'fragrance-family': { label: '🌺 Fragrance Family', color: 'rose' },
  performance: { label: '⏰ Longevity & Performance', color: 'indigo' },
  ingredient: { label: '🌿 Ingredient & Style', color: 'emerald' },
  demographic: { label: '🎯 Age & Demographic', color: 'amber' },
  lifestyle: { label: '🏠 Home & Lifestyle', color: 'cyan' },
  gift: { label: '🎁 Gift Collections', color: 'red' },
  regional: { label: '🌍 Regional & Cultural', color: 'violet' },
};
