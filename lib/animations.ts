import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useFadeIn(delay = 0, translateYAmount = 10) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateYAmount)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 320, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 300, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

export function useStaggeredFade(count: number, baseDelay = 0, step = 55) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(
      step,
      anims.map((a, i) =>
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1, duration: 300, delay: baseDelay, useNativeDriver: true,
          }),
          Animated.timing(a.translateY, {
            toValue: 0, duration: 280, delay: baseDelay, useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  return anims.map(a => ({ opacity: a.opacity, transform: [{ translateY: a.translateY }] }));
}
