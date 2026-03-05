/**
 * 可組合卡片渲染器 - 根據卡片類型渲染對應組件
 */
import React from 'react';
import type { MessageCardData } from './types';
import type { Product } from '../../types';
import { ProductRecommendationCard } from './ProductRecommendationCard';
import { MedicationFeedingRiskCard } from './MedicationFeedingRiskCard';
import { EmergencyAlertCard } from './EmergencyAlertCard';
import { BreedAgeRiskCard } from './BreedAgeRiskCard';
import { AILimitationCard } from './AILimitationCard';
import { PrivacyDataCard } from './PrivacyDataCard';
import { DisclaimerCard } from './DisclaimerCard';

interface MessageCardRendererProps {
  card: MessageCardData;
  dark?: boolean;
  onProductPress?: (product: Product) => void;
}

export function MessageCardRenderer({ card, dark, onProductPress }: MessageCardRendererProps) {
  switch (card.type) {
    case 'product_recommendation':
      return (
        <ProductRecommendationCard
          {...card}
          dark={dark}
          onProductPress={onProductPress}
        />
      );
    case 'medication_feeding_risk':
      return <MedicationFeedingRiskCard {...card} dark={dark} />;
    case 'emergency_alert':
      return <EmergencyAlertCard {...card} dark={dark} />;
    case 'breed_age_risk':
      return <BreedAgeRiskCard {...card} dark={dark} />;
    case 'ai_limitation':
      return <AILimitationCard {...card} dark={dark} />;
    case 'privacy_data':
      return <PrivacyDataCard {...card} dark={dark} />;
    case 'disclaimer':
      return <DisclaimerCard {...card} dark={dark} />;
    default:
      return null;
  }
}
