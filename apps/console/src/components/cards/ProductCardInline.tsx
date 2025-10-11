/**
 * 🛍️ Product Card (Inline)
 * ChatGPT-style inline result card for e-commerce products
 *
 * @module components/cards/ProductCardInline
 * @white-hat Compliant - Uses official vendor APIs only
 */

import React from 'react';

interface ProductData {
  id: string;
  name: string;
  vendor: 'trendyol' | 'hepsiburada' | 'n11' | 'amazon';
  price: number;
  currency: string;
  originalPrice?: number;
  discount?: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  url?: string;
}

interface ProductCardInlineProps {
  data: ProductData;
  onShowDetails?: () => void;
}

const VENDOR_COLORS: Record<string, { bg: string; text: string }> = {
  trendyol: { bg: '#f27a1a20', text: '#f27a1a' },
  hepsiburada: { bg: '#ff660020', text: '#ff6600' },
  n11: { bg: '#7c3aed20', text: '#7c3aed' },
  amazon: { bg: '#ff990020', text: '#ff9900' },
};

export default function ProductCardInline({
  data,
  onShowDetails,
}: ProductCardInlineProps) {
  const vendorStyle = VENDOR_COLORS[data.vendor] || VENDOR_COLORS.trendyol;
  const hasDiscount = data.discount && data.discount > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: data.currency || 'TRY',
    }).format(price);
  };

  return (
    <div
      className="product-card-inline"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
        maxWidth: '600px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Product Image */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {data.image ? (
            <img
              src={data.image}
              alt={data.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '48px' }}>📦</span>
          )}
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Vendor Badge */}
          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              background: vendorStyle.bg,
              color: vendorStyle.text,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {data.vendor}
          </div>

          {/* Product Name */}
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-text)',
              margin: 0,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.name}
          </h3>

          {/* Rating */}
          {data.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: '#f39c12' }}>{'⭐'.repeat(Math.round(data.rating))}</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                {data.rating.toFixed(1)}
              </span>
              {data.reviewCount && (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  ({data.reviewCount} değerlendirme)
                </span>
              )}
            </div>
          )}

          {/* Price Section */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {formatPrice(data.price)}
            </div>
            {hasDiscount && data.originalPrice && (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'line-through',
                  }}
                >
                  {formatPrice(data.originalPrice)}
                </div>
                <div
                  style={{
                    background: '#e7484820',
                    color: '#e74848',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  -{data.discount}%
                </div>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: data.inStock ? '#2ed573' : '#e74848',
            }}
          >
            <span>{data.inStock ? '✅' : '❌'}</span>
            <span>{data.inStock ? 'Stokta Mevcut' : 'Stokta Yok'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={onShowDetails}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'var(--color-primary)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🔍 Detayları Gör
        </button>
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'transparent',
              color: 'var(--color-primary)',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-background)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
          >
            🛒 Satıcıya Git
          </a>
        )}
      </div>
    </div>
  );
}

console.log('✅ ProductCardInline initialized');
