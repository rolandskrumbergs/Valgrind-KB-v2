import React, { useMemo } from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';

const fallbackImage: ImageSourcePropType = require('@/assets/images/fallback-thumbnail.png');

interface SmartImageProps extends Omit<ImageProps, 'source'> {
    source?: { uri?: string } | ImageSourcePropType;
}

const SmartImage: React.FC<SmartImageProps> = ({ source, ...rest }) => {
  const resolvedSource: ImageSourcePropType = useMemo(() => {
    if (
      source &&
      typeof source === 'object' &&
      'uri' in source &&
      (!source.uri || source.uri.trim() === '')
    ) {
      return fallbackImage;
    }
    return source ?? fallbackImage;
  }, [source]);

  return <Image source={resolvedSource} {...rest} />;
};

export default SmartImage;
