/**
 * =Í ProductCardInline - Ürün Kart1
 *
 * Displays product information inline within chat
 * - Product image, title, price
 * - Stock status
 * - Quick actions (add to cart, favorite)
 * - Turkish default
 *
 * @module components/unified/cards
 */

'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ProductData {
  id: string;
  title: string;
  vendor: string;
  price: number;
  currency: string;
  originalPrice?: number;
  imageUrl?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  url?: string;
}

interface ProductCardInlineProps {
  data: ProductData;
  locale?: string;
}

// ============================================================================
// Stock Status Translations
// ============================================================================

const STOCK_STATUS_TR: Record<string, string> = {
  in_stock: 'Stokta',
  low_stock: 'Son Ürünler',
  out_of_stock: 'Stokta Yok',
};

// ============================================================================
// ProductCardInline Component
// ============================================================================

export function ProductCardInline({
  data,
  locale = 'tr',
}: ProductCardInlineProps) {
  const stockText = STOCK_STATUS_TR[data.stockStatus] || data.stockStatus;
  const hasDiscount = data.originalPrice && data.originalPrice > data.price;
  const discountPercent = hasDiscount
    ? Math.round(((data.originalPrice! - data.price) / data.originalPrice!) * 100)
    : 0;

  return (
    <div className="product-card-inline">
      {/* Product Image */}
      <div className="product-image">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.title} />
        ) : (
          <div className="image-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect
                x="8"
                y="8"
                width="32"
                height="32"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="18" cy="18" r="3" fill="currentColor" />
              <path
                d="M8 32L16 24L24 32L32 24L40 32"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Vendor Badge */}
        <div className="vendor-badge">{data.vendor}</div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        {/* Title */}
        <h3 className="product-title">{data.title}</h3>

        {/* Rating */}
        {data.rating && (
          <div className="product-rating">
            <span className="rating-stars">{'P'.repeat(Math.round(data.rating))}</span>
            <span className="rating-value">{data.rating.toFixed(1)}</span>
            {data.reviewCount && (
              <span className="review-count">({data.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="product-price">
          <span className="current-price">
            {data.price.toLocaleString(locale)} {data.currency}
          </span>
          {hasDiscount && (
            <>
              <span className="original-price">
                {data.originalPrice!.toLocaleString(locale)} {data.currency}
              </span>
              <span className="discount-badge">%{discountPercent}</span>
            </>
          )}
        </div>

        {/* Stock Status */}
        <div className={`stock-status status-${data.stockStatus}`}>
          <span className="stock-indicator" />
          <span className="stock-text">{stockText}</span>
          {data.stockCount && (
            <span className="stock-count">({data.stockCount} adet)</span>
          )}
        </div>

        {/* Actions */}
        <div className="product-actions">
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button primary"
            >
              Ürüne Git ’
            </a>
          )}
          <button className="action-button secondary">e</button>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .product-card-inline {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          color: #fff;
        }

        .product-image {
          position: relative;
          width: 140px;
          height: 140px;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 12px;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.3);
        }

        .vendor-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .product-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .rating-stars {
          color: #fbbf24;
        }

        .rating-value {
          font-weight: 600;
        }

        .review-count {
          color: rgba(255, 255, 255, 0.6);
        }

        .product-price {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .current-price {
          font-size: 20px;
          font-weight: 700;
          color: rgba(255, 215, 0, 0.9);
        }

        .original-price {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: line-through;
        }

        .discount-badge {
          padding: 4px 8px;
          background: rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .stock-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .stock-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-in_stock .stock-indicator {
          background: #22c55e;
        }

        .status-low_stock .stock-indicator {
          background: #fbbf24;
        }

        .status-out_of_stock .stock-indicator {
          background: #ef4444;
        }

        .stock-text {
          font-weight: 500;
        }

        .stock-count {
          color: rgba(255, 255, 255, 0.6);
        }

        .product-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .action-button {
          padding: 10px 20px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .action-button.primary {
          flex: 1;
          background: rgba(255, 215, 0, 0.2);
          color: #fff;
        }

        .action-button.primary:hover {
          background: rgba(255, 215, 0, 0.3);
          transform: scale(1.02);
        }

        .action-button.secondary {
          width: 44px;
          background: rgba(255, 215, 0, 0.1);
          color: rgba(255, 215, 0, 0.8);
        }

        .action-button.secondary:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.05);
        }

        .action-button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

export default ProductCardInline;
